import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function listAllFiles(
  adminClient: any,
  bucketName: string
): Promise<{ path: string; size: number }[]> {
  const results: { path: string; size: number }[] = [];

  // List root items (may be folders or files)
  const { data: rootItems } = await adminClient.storage
    .from(bucketName)
    .list("", { limit: 1000 });

  for (const item of rootItems ?? []) {
    if (item.id === null) {
      // It's a folder — list its contents
      const { data: files } = await adminClient.storage
        .from(bucketName)
        .list(item.name, { limit: 1000 });

      for (const file of files ?? []) {
        if (file.id !== null) {
          // It's a file
          results.push({
            path: `${item.name}/${file.name}`,
            size: file.metadata?.size ?? 0,
          });
        }
      }
    } else {
      // It's a file at root level
      results.push({ path: item.name, size: item.metadata?.size ?? 0 });
    }
  }

  return results;
}

function getPublicUrl(supabaseUrl: string, bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// ---------------------------------------------------------------------------
// Scan logic — returns orphaned files across all three buckets
// ---------------------------------------------------------------------------

async function scanOrphans(
  adminClient: any,
  supabaseUrl: string
): Promise<{ bucket: string; path: string; size: number }[]> {
  const orphans: { bucket: string; path: string; size: number }[] = [];

  // ── 1. product-images vs products.image_url ──────────────────────────────
  const [productFiles, productsRows] = await Promise.all([
    listAllFiles(adminClient, "product-images"),
    adminClient.from("products").select("image_url"),
  ]);

  const productUrls = new Set<string>();
  for (const row of productsRows.data ?? []) {
    if (!row.image_url) continue;
    // image_url may be comma-separated
    for (const url of row.image_url.split(",")) {
      const trimmed = url.trim();
      if (trimmed) productUrls.add(trimmed);
    }
  }

  for (const file of productFiles) {
    const publicUrl = getPublicUrl(supabaseUrl, "product-images", file.path);
    if (!productUrls.has(publicUrl)) {
      orphans.push({ bucket: "product-images", path: file.path, size: file.size });
    }
  }

  // ── 2. category-images vs categories.image_url ───────────────────────────
  const [categoryFiles, categoriesRows] = await Promise.all([
    listAllFiles(adminClient, "category-images"),
    adminClient.from("categories").select("image_url"),
  ]);

  const categoryUrls = new Set<string>();
  for (const row of categoriesRows.data ?? []) {
    if (row.image_url) categoryUrls.add(row.image_url.trim());
  }

  for (const file of categoryFiles) {
    const publicUrl = getPublicUrl(supabaseUrl, "category-images", file.path);
    if (!categoryUrls.has(publicUrl)) {
      orphans.push({ bucket: "category-images", path: file.path, size: file.size });
    }
  }

  // ── 3. store-logos vs store_settings (logo_url, banner_url, favicon_url) ──
  const [logoFiles, storeSettingsRows] = await Promise.all([
    listAllFiles(adminClient, "store-logos"),
    adminClient.from("store_settings").select("logo_url, banner_url, favicon_url"),
  ]);

  const storeUrls = new Set<string>();
  for (const row of storeSettingsRows.data ?? []) {
    if (row.logo_url) storeUrls.add(row.logo_url.trim());
    if (row.banner_url) storeUrls.add(row.banner_url.trim());
    if (row.favicon_url) storeUrls.add(row.favicon_url.trim());
  }

  for (const file of logoFiles) {
    const publicUrl = getPublicUrl(supabaseUrl, "store-logos", file.path);
    if (!storeUrls.has(publicUrl)) {
      orphans.push({ bucket: "store-logos", path: file.path, size: file.size });
    }
  }

  return orphans;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── 1. Verify caller is super_admin ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: callerUser },
      error: callerErr,
    } = await callerClient.auth.getUser();

    if (callerErr || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileErr } = await callerClient
      .from("profiles")
      .select("is_super_admin")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (profileErr || !profile?.is_super_admin) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    const body = await req.json();
    const action: "scan" | "clean" = body?.action;

    if (action !== "scan" && action !== "clean") {
      return new Response(
        JSON.stringify({ error: "Invalid action. Expected 'scan' or 'clean'." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 3. Admin client for storage & DB operations ───────────────────────────
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ── 4. Scan ───────────────────────────────────────────────────────────────
    const orphans = await scanOrphans(adminClient, supabaseUrl);
    const totalSize = orphans.reduce((sum, f) => sum + f.size, 0);
    const totalCount = orphans.length;

    if (action === "scan") {
      return new Response(
        JSON.stringify({ orphans, totalSize, totalCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 5. Clean ──────────────────────────────────────────────────────────────
    let deleted = 0;
    let freedBytes = 0;

    // Group orphans by bucket for batch deletes
    const byBucket: Record<string, { path: string; size: number }[]> = {};
    for (const orphan of orphans) {
      if (!byBucket[orphan.bucket]) byBucket[orphan.bucket] = [];
      byBucket[orphan.bucket].push({ path: orphan.path, size: orphan.size });
    }

    for (const [bucket, files] of Object.entries(byBucket)) {
      const paths = files.map((f) => f.path);
      const { error: removeErr } = await adminClient.storage
        .from(bucket)
        .remove(paths);

      if (removeErr) {
        console.error(`[storage-sweep] Error deleting from ${bucket}:`, removeErr.message);
        // Continue with remaining buckets rather than aborting
        continue;
      }

      deleted += files.length;
      freedBytes += files.reduce((sum, f) => sum + f.size, 0);
    }

    return new Response(
      JSON.stringify({ deleted, freedBytes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("storage-sweep error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

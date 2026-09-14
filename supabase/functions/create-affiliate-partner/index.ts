import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS_HEADERS });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is a super admin
  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user: callerUser } } = await callerClient.auth.getUser();
  if (!callerUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS_HEADERS });
  }

  const { data: callerProfile } = await supabaseAdmin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", callerUser.id)
    .maybeSingle();

  if (!callerProfile?.is_super_admin) {
    return new Response(JSON.stringify({ error: "Apenas Super Admins podem criar parceiros." }), { status: 403, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const {
      full_name,
      email,
      password,
      affiliate_code,
      commission_rate = 20,
      demo_store_name,
      demo_store_slug,
      pix_key,
      notes,
    } = body;

    // Validate required fields
    if (!full_name || !email || !password || !affiliate_code || !demo_store_name || !demo_store_slug) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: full_name, email, password, affiliate_code, demo_store_name, demo_store_slug" }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const cleanCode = affiliate_code.toUpperCase().trim().replace(/[^A-Z0-9]/g, "");
    const cleanSlug = demo_store_slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

    // Check code uniqueness
    const { data: existingAffiliate } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("code", cleanCode)
      .maybeSingle();

    if (existingAffiliate) {
      return new Response(
        JSON.stringify({ error: `O código de afiliado "${cleanCode}" já está em uso.` }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Check slug uniqueness
    const { data: existingStore } = await supabaseAdmin
      .from("stores")
      .select("id")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (existingStore) {
      return new Response(
        JSON.stringify({ error: `O subdomínio "${cleanSlug}" já está em uso.` }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1. Create user in Supabase Auth
    let affiliateUser;
    const { data: newUser, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    });

    if (createAuthErr) {
      if (createAuthErr.message.includes("already registered") || createAuthErr.status === 422) {
        const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
        const found = listUsers.users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
        if (found) {
          affiliateUser = found;
        } else {
          return new Response(
            JSON.stringify({ error: "E-mail já cadastrado no sistema." }),
            { status: 400, headers: CORS_HEADERS }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: `Erro ao criar conta: ${createAuthErr.message}` }),
          { status: 400, headers: CORS_HEADERS }
        );
      }
    } else {
      affiliateUser = newUser.user;
    }

    // 2. Update profile with full name
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: affiliateUser.id, full_name: full_name.trim() }, { onConflict: "id" });

    // 3. Create the demo store (a normal store, active status)
    const { data: demoStore, error: storeErr } = await supabaseAdmin
      .from("stores")
      .insert({
        name: demo_store_name.trim(),
        slug: cleanSlug,
        status: "active",
        plan: "profissional",
        trial_started_at: new Date().toISOString(),
      } as any)
      .select("id")
      .single();

    if (storeErr) {
      return new Response(
        JSON.stringify({ error: `Erro ao criar loja demo: ${storeErr.message}` }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 4. Link user as store owner
    await supabaseAdmin
      .from("store_members")
      .insert({ store_id: demoStore.id, user_id: affiliateUser.id, role: "owner" } as any);

    // 5. Create affiliate record
    const { data: affiliate, error: affiliateErr } = await supabaseAdmin
      .from("affiliates")
      .insert({
        user_id: affiliateUser.id,
        demo_store_id: demoStore.id,
        code: cleanCode,
        commission_rate: Number(commission_rate),
        status: "active",
        pix_key: pix_key || null,
        notes: notes || null,
      })
      .select("id, code")
      .single();

    if (affiliateErr) {
      return new Response(
        JSON.stringify({ error: `Erro ao criar perfil de afiliado: ${affiliateErr.message}` }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        affiliate_id: affiliate.id,
        affiliate_code: affiliate.code,
        user_id: affiliateUser.id,
        demo_store_id: demoStore.id,
        demo_store_slug: cleanSlug,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("[create-affiliate-partner] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitePayload {
  email: string;
  full_name: string;
  store_id: string;
  role: "owner" | "admin" | "staff";
  redirect_url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Verify caller is super_admin using their JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use anon client with caller's JWT to check identity
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check super_admin flag in profiles
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

    // 2. Parse payload
    const payload: InvitePayload = await req.json();
    const { email, full_name, store_id, role, redirect_url } = payload;

    if (!email || !store_id || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, store_id, role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Use service role admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // User already exists — just link to store
      userId = existingUser.id;
    } else {
      // Invite new user
      // Use SITE_URL env var or fallback to the production domain.
      // NOTE: the redirect URL must be listed in Supabase Auth → URL Configuration → Redirect URLs.
      const siteUrl = Deno.env.get("SITE_URL") || "https://scalius.com.br";
      const inviteRedirect = redirect_url || `${siteUrl}/set-password`;
      const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteRedirect,
        data: { full_name: full_name || "" },
      });

      if (inviteErr || !inviteData?.user) {
        return new Response(JSON.stringify({ error: inviteErr?.message || "Failed to invite user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = inviteData.user.id;

      // Update profile with full_name if provided
      if (full_name) {
        await adminClient
          .from("profiles")
          .upsert({ id: userId, full_name, is_super_admin: false }, { onConflict: "id" });
      }
    }

    // 4. Check if already a member of this store
    const { data: existingMember } = await adminClient
      .from("store_members")
      .select("id")
      .eq("store_id", store_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMember) {
      return new Response(JSON.stringify({
        ok: true,
        user_id: userId,
        already_member: true,
        message: "Usuário já é membro desta loja",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Insert store_members link
    const { error: memberErr } = await adminClient
      .from("store_members")
      .insert({ store_id, user_id: userId, role });

    if (memberErr) {
      return new Response(JSON.stringify({ error: memberErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      user_id: userId,
      already_member: false,
      message: existingUser
        ? "Usuário existente vinculado à loja com sucesso"
        : "Convite enviado e usuário vinculado à loja com sucesso",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("invite-store-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

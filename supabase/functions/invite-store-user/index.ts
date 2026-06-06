import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitePayload {
  email: string;
  full_name?: string;   // optional — only used if creating a new user
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

    const siteUrl = Deno.env.get("SITE_URL") || "https://scalius.com.br";
    const inviteRedirect = redirect_url || `${siteUrl}/set-password`;

    // 4. Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;
    let isNewUser = false;
    const isConfirmed = !!existingUser?.email_confirmed_at;

    if (existingUser && isConfirmed) {
      // ── User exists with confirmed email (has password) ────────────────────
      // Link silently — do NOT send any email.
      userId = existingUser.id;
      console.log(`[invite-store-user] User ${email} already confirmed — linking silently, no email sent.`);

    } else if (existingUser && !isConfirmed) {
      // ── User exists but never confirmed (stuck invite) ─────────────────────
      // Delete and re-invite so they get a fresh link.
      console.log(`[invite-store-user] Deleting unconfirmed user ${email} (ID: ${existingUser.id}) to re-invite.`);
      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(existingUser.id);
      if (deleteErr) {
        return new Response(JSON.stringify({ error: `Erro ao remover convite anterior: ${deleteErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      isNewUser = true;
      const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteRedirect,
        data: { full_name: full_name ?? "" },
      });
      if (inviteErr || !inviteData?.user) {
        return new Response(JSON.stringify({ error: inviteErr?.message || "Failed to invite user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = inviteData.user.id;
      if (full_name) {
        await adminClient.from("profiles").upsert({ id: userId, full_name, is_super_admin: false }, { onConflict: "id" });
      }

    } else {
      // ── Brand new user ─────────────────────────────────────────────────────
      isNewUser = true;
      const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteRedirect,
        data: { full_name: full_name ?? "" },
      });
      if (inviteErr || !inviteData?.user) {
        return new Response(JSON.stringify({ error: inviteErr?.message || "Failed to invite user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = inviteData.user.id;
      if (full_name) {
        await adminClient.from("profiles").upsert({ id: userId, full_name, is_super_admin: false }, { onConflict: "id" });
      }
    }

    // 5. Check if already a member of this store
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
        is_new_user: false,
        message: "Usuário já é membro desta loja",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Insert store_members link
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
      is_new_user: isNewUser,
      message: isNewUser
        ? "Convite enviado e usuário vinculado à loja com sucesso"
        : "Usuário existente vinculado à loja sem envio de e-mail",
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

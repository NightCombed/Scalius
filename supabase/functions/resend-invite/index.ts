import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendPayload {
  user_id: string;      // ID do usuário em store_members
  store_slug: string;   // para montar o redirect_url
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 1. Verificar se o chamador é super_admin
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

    const { data: profile } = await callerClient
      .from("profiles")
      .select("is_super_admin")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!profile?.is_super_admin) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse payload
    const { user_id, store_slug }: ResendPayload = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 3. Buscar o usuário pelo ID
    const { data: { user: targetUser }, error: getUserErr } = await adminClient.auth.admin.getUserById(user_id);

    if (getUserErr || !targetUser) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado no sistema de autenticação." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = targetUser.email;
    if (!email) {
      return new Response(JSON.stringify({ error: "Usuário sem e-mail registrado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Verificar se o usuário ainda não confirmou o e-mail
    const isConfirmed = !!targetUser.email_confirmed_at;
    if (isConfirmed) {
      return new Response(JSON.stringify({
        ok: false,
        message: "Este usuário já confirmou o e-mail e definiu sua senha. Use a opção de redefinição de senha se necessário.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Buscar o profile para preservar o nome
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", user_id)
      .maybeSingle();

    const full_name = profileData?.full_name ?? "";

    // 6. Deletar o usuário não confirmado para poder re-convidar
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteErr) {
      return new Response(JSON.stringify({ error: `Erro ao remover convite anterior: ${deleteErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Recriar o convite com novo link
    const siteUrl = Deno.env.get("SITE_URL") || "https://scalius.com.br";
    const redirectTo = store_slug
      ? `https://${store_slug}.scalius.com.br/set-password`
      : `${siteUrl}/set-password`;

    const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name },
    });

    if (inviteErr || !inviteData?.user) {
      return new Response(JSON.stringify({ error: inviteErr?.message || "Falha ao reenviar convite" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = inviteData.user.id;

    // 8. Recriar o profile
    if (full_name) {
      await adminClient
        .from("profiles")
        .upsert({ id: newUserId, full_name, is_super_admin: false }, { onConflict: "id" });
    }

    // 9. Atualizar todos os store_members que tinham o antigo user_id
    // (o delete/invite cria um novo UUID, então precisa atualizar os vínculos)
    const { error: updateMembersErr } = await adminClient
      .from("store_members")
      .update({ user_id: newUserId } as any)
      .eq("user_id", user_id);

    if (updateMembersErr) {
      console.warn("[resend-invite] Aviso: não foi possível atualizar store_members:", updateMembersErr.message);
    }

    return new Response(JSON.stringify({
      ok: true,
      new_user_id: newUserId,
      message: `Convite reenviado com sucesso para ${email}.`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("resend-invite error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

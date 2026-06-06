import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verificar se o chamador é super_admin
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

    const { user_ids }: { user_ids: string[] } = await req.json();

    if (!user_ids || user_ids.length === 0) {
      return new Response(JSON.stringify({ pending: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Buscar todos os usuários e verificar quais não confirmaram email
    // O Supabase Admin API não tem filtro por IDs direto, então usamos listUsers com paginação
    // Para listas pequenas (< 1000 users), isso é viável
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIdSet = new Set(user_ids);
    const pending: string[] = [];

    for (const u of users ?? []) {
      if (userIdSet.has(u.id) && !u.email_confirmed_at) {
        pending.push(u.id);
      }
    }

    return new Response(JSON.stringify({ pending }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("get-members-status error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

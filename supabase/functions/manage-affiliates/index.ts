import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAffiliatePayload {
  action: "create_affiliate";
  email: string;
  phone?: string | null;
  full_name?: string | null;
  code: string;
  coupon_code?: string | null;
  commission_rate_pct?: number;
  pix_key?: string | null;
  notes?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Verify caller is super_admin using their JWT token via adminClient
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Cabeçalho de autorização não enviado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user: callerUser }, error: callerErr } = await adminClient.auth.getUser(token);

    if (callerErr || !callerUser) {
      return new Response(
        JSON.stringify({ error: `Não autorizado: ${callerErr?.message || "Sessão de usuário inválida ou expirada"}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is super_admin in profiles table
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_super_admin")
      .eq("id", callerUser.id)
      .maybeSingle();

    if (!profile?.is_super_admin) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: Apenas Super Admins podem cadastrar parceiros." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request body
    const body: CreateAffiliatePayload = await req.json();

    if (body.action === "create_affiliate") {
      const cleanEmail = body.email.trim().toLowerCase();
      const cleanCode = body.code.trim().toUpperCase();
      const cleanCoupon = body.coupon_code ? body.coupon_code.trim().toUpperCase() : null;
      const rate = typeof body.commission_rate_pct === "number" ? body.commission_rate_pct : 20.0;
      const partnerName = body.full_name?.trim() || cleanEmail.split("@")[0];

      if (!cleanEmail || !cleanCode) {
        return new Response(
          JSON.stringify({ error: "E-mail e código de indicação são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user in auth.users using admin API
      const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) {
        return new Response(
          JSON.stringify({ error: `Erro ao listar usuários: ${listErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let targetUser = userList.users.find((u) => u.email?.toLowerCase() === cleanEmail);

      // If user doesn't exist in auth.users, create the user automatically!
      if (!targetUser) {
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: { full_name: partnerName },
        });

        if (createErr || !newUser.user) {
          return new Response(
            JSON.stringify({ error: `Erro ao criar conta para ${cleanEmail}: ${createErr?.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        targetUser = newUser.user;
      }

      // Always update/ensure profile in public.profiles with the partnerName
      const { error: profUpsertErr } = await adminClient.from("profiles").upsert({
        id: targetUser.id,
        full_name: partnerName,
      }, { onConflict: "id" });

      if (profUpsertErr) {
        console.error("Erro ao atualizar profile no Edge Function:", profUpsertErr);
      }

      // Insert affiliate
      const { data: affiliateData, error: affErr } = await adminClient
        .from("affiliates")
        .insert({
          user_id: targetUser.id,
          email: cleanEmail,
          phone: body.phone?.trim() || null,
          code: cleanCode,
          coupon_code: cleanCoupon,
          commission_rate: rate,
          pix_key: body.pix_key?.trim() || null,
          notes: body.notes?.trim() || null,
          status: "active",
        })
        .select()
        .single();

      if (affErr) {
        if (affErr.code === "23505" || affErr.message.includes("unique")) {
          return new Response(
            JSON.stringify({ error: "Já existe um parceiro cadastrado com esse código ou e-mail." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: `Erro ao salvar parceiro no banco: ${affErr.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, affiliate: affiliateData, message: `Parceiro ${cleanCode} cadastrado com sucesso!` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação não suportada" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Erro no servidor da função: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

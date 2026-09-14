import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Preços dos planos em centavos
const PLAN_PRICES: Record<string, { price_cents: number; label: string }> = {
  basico:       { price_cents: 4700,  label: "Scalius Plano Básico" },
  profissional: { price_cents: 8900,  label: "Scalius Plano Profissional" },
  plus:         { price_cents: 15900, label: "Scalius Plano Plus" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      plan_id,
      lead_id,
      name,
      whatsapp,
      email,
      store_name,
      slug,
      password,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      fbclid,
      referral_code,
    } = body;

    // Resolve affiliate_id from referral_code (link/cupom)
    let resolvedAffiliateId: string | null = null;
    if (referral_code) {
      const cleanCode = String(referral_code).toUpperCase().trim();
      const { data: affiliateRow } = await supabase
        .from("affiliates")
        .select("id")
        .eq("code", cleanCode)
        .eq("status", "active")
        .maybeSingle();
      if (affiliateRow) {
        resolvedAffiliateId = affiliateRow.id;
        console.log("[checkout] Afiliado resolvido:", cleanCode, "→", resolvedAffiliateId);
      } else {
        console.log("[checkout] Código de afiliado inválido ou inativo:", cleanCode);
      }
    }

    // Validar plan_id
    const planInfo = PLAN_PRICES[plan_id];
    if (!planInfo) {
      return new Response(
        JSON.stringify({ error: `Plano inválido: ${plan_id}` }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validar campos obrigatórios
    if (!name || !whatsapp) {
      return new Response(
        JSON.stringify({ error: "Nome e WhatsApp são obrigatórios" }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let createdStoreId: string | null = null;
    let createdUserId: string | null = null;

    // Se os dados da loja e senha foram informados, realiza o pré-cadastro da conta e da loja
    if (store_name && slug && password && email) {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

      // 1. Verificar se slug já existe
      const { data: existingStore } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (existingStore) {
        return new Response(
          JSON.stringify({ error: `O subdomínio "${cleanSlug}" já está em uso por outra loja.` }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      // 2. Criar ou buscar Usuário no Supabase Auth
      let authUser = null;
      const { data: newUser, error: createAuthErr } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        email_confirm: true,
        user_metadata: { name: name.trim(), whatsapp },
      });

      if (createAuthErr) {
        if (createAuthErr.message.includes("already registered") || createAuthErr.status === 422) {
          // Usuário já cadastrado com este e-mail — tenta atualizar senha
          const { data: listUsers } = await supabase.auth.admin.listUsers();
          const found = listUsers.users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
          if (found) {
            authUser = found;
            await supabase.auth.admin.updateUserById(found.id, { password });
          } else {
            return new Response(
              JSON.stringify({ error: "E-mail já cadastrado no sistema." }),
              { status: 400, headers: CORS_HEADERS }
            );
          }
        } else {
          console.error("[checkout] Erro ao criar conta de usuário:", createAuthErr);
          return new Response(
            JSON.stringify({ error: `Erro ao criar conta de usuário: ${createAuthErr.message}` }),
            { status: 400, headers: CORS_HEADERS }
          );
        }
      } else {
        authUser = newUser.user;
      }

      createdUserId = authUser.id;

      // 3. Criar a Loja (status 'pending' até a confirmação do pagamento pelo webhook)
      const storeInsertData: any = {
        name: store_name.trim(),
        slug: cleanSlug,
        status: "pending",
        plan: plan_id,
        trial_started_at: new Date().toISOString(),
      };
      // Atribuição única de afiliado: gravar somente se válido
      if (resolvedAffiliateId) storeInsertData.affiliate_id = resolvedAffiliateId;

      const { data: newStore, error: createStoreErr } = await supabase
        .from("stores")
        .insert(storeInsertData)
        .select("id")
        .single();

      if (createStoreErr) {
        console.error("[checkout] Erro ao criar loja:", createStoreErr);
        return new Response(
          JSON.stringify({ error: `Erro ao criar loja: ${createStoreErr.message}` }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      createdStoreId = newStore.id;

      // 4. Vincular o usuário como dono da loja em store_members
      const { error: memberErr } = await supabase
        .from("store_members")
        .insert({
          store_id: createdStoreId,
          user_id: createdUserId,
          role: "owner",
        } as any);

      if (memberErr) {
        console.error("[checkout] Erro ao vincular store_member:", memberErr);
      }
    }

    // Obter access token da conta Scalius no Mercado Pago
    const mpAccessToken = Deno.env.get("MP_PLATFORM_ACCESS_TOKEN");
    if (!mpAccessToken) {
      console.error("[checkout] MP_PLATFORM_ACCESS_TOKEN não configurado");
      return new Response(
        JSON.stringify({ error: "Configuração de pagamento indisponível" }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Montar URL de retorno (success/failure/pending)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const baseUrl = "https://scalius.com.br";

    const payerEmail = email && email.trim() ? email.trim() : `cliente.${whatsapp.replace(/\D/g, "")}@scalius.com.br`;

    // Criar preferência de pagamento no Mercado Pago Checkout Pro
    const mpPayload = {
      items: [
        {
          id: plan_id,
          title: planInfo.label,
          description: `Assinatura mensal do ${planInfo.label}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: planInfo.price_cents / 100,
        },
      ],
      payer: {
        name: name.trim(),
        email: payerEmail,
      },
      back_urls: {
        success: `${baseUrl}/obrigado`,
        failure: `${baseUrl}/#precos`,
        pending: `${baseUrl}/obrigado`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      metadata: {
        type: "subscription",
        plan_id,
        name: name.trim(),
        whatsapp,
        email: payerEmail,
        store_id: createdStoreId,
        user_id: createdUserId,
        ...(resolvedAffiliateId ? { affiliate_id: resolvedAffiliateId } : {}),
        ...(referral_code ? { referral_code: String(referral_code).toUpperCase().trim() } : {}),
        ...(utm_source ? { utm_source } : {}),
        ...(utm_medium ? { utm_medium } : {}),
        ...(utm_campaign ? { utm_campaign } : {}),
        ...(utm_content ? { utm_content } : {}),
        ...(fbclid ? { fbclid } : {}),
      },
      statement_descriptor: "SCALIUS",
      expires: false,
    };

    console.log("[checkout] Criando preferência MP para plano:", plan_id, "valor:", planInfo.price_cents / 100);

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `sub-${Date.now()}-${whatsapp.replace(/\D/g, "")}`,
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await mpRes.json();
    console.log("[checkout] MP response status:", mpRes.status, "preference_id:", mpData.id);

    if (!mpRes.ok) {
      console.error("[checkout] MP API error:", JSON.stringify(mpData));
      return new Response(
        JSON.stringify({ error: "Erro ao criar preferência de pagamento", details: mpData }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const checkoutUrl: string = mpData.init_point;
    const preferenceId: string = mpData.id;

    // Salvar registro em subscription_payments (com affiliate_id e store_id se disponíveis)
    const paymentInsertData: any = {
      lead_id: lead_id ?? null,
      name: name.trim(),
      whatsapp,
      email: email?.trim() ?? null,
      plan_id,
      plan_price_cents: planInfo.price_cents,
      mp_preference_id: preferenceId,
      checkout_url: checkoutUrl,
      utm_source: utm_source ?? null,
      utm_medium: utm_medium ?? null,
      utm_campaign: utm_campaign ?? null,
      utm_content: utm_content ?? null,
      fbclid: fbclid ?? null,
      status: "pending",
    };
    if (resolvedAffiliateId) paymentInsertData.affiliate_id = resolvedAffiliateId;
    if (createdStoreId) paymentInsertData.store_id = createdStoreId;
    if (referral_code) paymentInsertData.affiliate_code = String(referral_code).toUpperCase().trim();

    const { data: payment, error: insertErr } = await supabase
      .from("subscription_payments")
      .insert(paymentInsertData)
      .select("id")
      .single();

    if (insertErr) {
      console.error("[checkout] Erro ao salvar subscription_payment:", JSON.stringify(insertErr));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        checkout_url: checkoutUrl,
        preference_id: preferenceId,
        subscription_payment_id: payment?.id ?? null,
        store_id: createdStoreId,
        user_id: createdUserId,
      }),
      { headers: CORS_HEADERS }
    );

  } catch (e) {
    console.error("[checkout] Erro inesperado:", e.message, e.stack);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});

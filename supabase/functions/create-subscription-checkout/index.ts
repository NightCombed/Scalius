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
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      fbclid,
    } = body;

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
        email: email && email.trim() ? email.trim() : `cliente.${whatsapp.replace(/\D/g, "")}@scalius.com.br`,
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
        ...(email ? { email: email.trim() } : {}),
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

    // Salvar registro em subscription_payments
    const { data: payment, error: insertErr } = await supabase
      .from("subscription_payments")
      .insert({
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
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[checkout] Erro ao salvar subscription_payment:", JSON.stringify(insertErr));
      // Não bloquear o fluxo — retornar URL mesmo se a persistência falhar
    }

    console.log("[checkout] subscription_payment criado:", payment?.id, "→ checkout_url gerado");

    return new Response(
      JSON.stringify({
        ok: true,
        checkout_url: checkoutUrl,
        preference_id: preferenceId,
        subscription_payment_id: payment?.id ?? null,
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

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Always return 200 quickly to avoid MP retries
  if (req.method !== "POST") return new Response("ok", { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: any = {};
  try {
    const raw = await req.text();
    body = raw ? JSON.parse(raw) : {};
  } catch {
    console.error("Failed to parse webhook body");
    return new Response("ok", { status: 200 });
  }

  console.log("[webhook] received body:", JSON.stringify(body));
  console.log("[webhook] headers x-signature:", req.headers.get("x-signature"));
  console.log("[webhook] headers x-request-id:", req.headers.get("x-request-id"));

  // ── Simulate endpoint ─────────────────────────────────────────────────
  if (body.action === "simulate") {
    const secret = req.headers.get("x-simulate-secret");
    if (secret !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }
    const { order_id, payment_status: simStatus = "approved" } = body;
    if (!order_id) return new Response(JSON.stringify({ error: "Missing order_id" }), { status: 400 });
    const result = await processOrderPaymentStatus(supabase, null, order_id, simStatus);
    return new Response(JSON.stringify({ ok: true, result }), { headers: { "Content-Type": "application/json" } });
  }

  // ── Extract payment ID from URL query param (MP standard) ───────────────────
  const url = new URL(req.url);
  const dataIdFromUrl = url.searchParams.get("data.id") || String(body.data?.id || "");
  const eventType: string = body.type || body.action || "unknown";

  console.log("[webhook] data.id:", dataIdFromUrl, "type:", eventType);

  if (!dataIdFromUrl || dataIdFromUrl === "" || dataIdFromUrl === "undefined") {
    console.log("[webhook] no data.id, ignoring");
    return new Response("ok", { status: 200 });
  }

  if (!eventType.includes("payment")) {
    console.log("[webhook] non-payment event, ignoring:", eventType);
    return new Response("ok", { status: 200 });
  }

  // ── Signature validation ───────────────────────────────────────────────
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET") || null;
  const signatureValid = await validateSignature(xSignature, xRequestId, dataIdFromUrl, webhookSecret);

  if (!signatureValid) {
    console.warn("[webhook] invalid signature, logging and returning 200");
    await supabase.from("webhook_logs").insert({
      provider: "mercadopago",
      external_id: dataIdFromUrl,
      event_type: eventType,
      raw_status: "signature_invalid",
      processed: false,
      error: "Invalid or missing signature",
    });
    return new Response("ok", { status: 200 });
  }

  // ── Determinar o tipo de pagamento (assinatura da plataforma vs pedido de loja) ──

  // 1. Verificar se já existe um subscription_payment com este payment_id
  const { data: existingSubPayment } = await supabase
    .from("subscription_payments")
    .select("id, status, plan_id")
    .eq("mp_payment_id", dataIdFromUrl)
    .maybeSingle();

  if (existingSubPayment) {
    // Já processamos este pagamento de assinatura antes — idempotência
    if (existingSubPayment.status === "paid") {
      console.log("[webhook] subscription already paid:", existingSubPayment.id);
      return new Response("ok", { status: 200 });
    }
  }

  // ── Buscar token para consultar o MP ──────────────────────────────────
  // Para assinaturas: usa token da plataforma Scalius
  // Para pedidos de loja: usa token da loja específica
  const platformToken = Deno.env.get("MP_PLATFORM_ACCESS_TOKEN");

  // 2. Verificar se é um pedido de loja (busca na tabela orders)
  const { data: order } = await supabase
    .from("orders")
    .select("id, store_id, payment_status")
    .eq("external_payment_id", dataIdFromUrl)
    .maybeSingle();

  console.log("[webhook] order lookup:", order ? `found ${order.id}` : "not found");

  // ── Processar pagamento de PEDIDO DE LOJA ────────────────────────────
  if (order) {
    if (order.payment_status === "paid") {
      await supabase.from("webhook_logs").insert({
        store_id: order.store_id, order_id: order.id,
        provider: "mercadopago", external_id: dataIdFromUrl,
        event_type: eventType, raw_status: "already_paid", processed: false,
      });
      return new Response("ok", { status: 200 });
    }

    // Obter access token da loja
    const { data: secrets } = await supabase
      .from("store_secrets")
      .select("mp_access_token")
      .eq("store_id", order.store_id)
      .maybeSingle();

    if (!secrets?.mp_access_token) {
      console.error("[webhook] no MP token for store:", order.store_id);
      await supabase.from("webhook_logs").insert({
        store_id: order.store_id, order_id: order.id,
        provider: "mercadopago", external_id: dataIdFromUrl,
        event_type: eventType, processed: false, error: "No MP access token",
      });
      return new Response("ok", { status: 200 });
    }

    // Confirmar status com o MP usando token da loja
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataIdFromUrl}`, {
      headers: { Authorization: `Bearer ${secrets.mp_access_token}` },
    });
    const mpPayment = await mpRes.json();
    const mpStatus: string = mpPayment.status ?? "unknown";
    console.log("[webhook] MP confirmed status (store order):", mpStatus);

    const result = await processOrderPaymentStatus(supabase, order, null, mpStatus);

    await supabase.from("webhook_logs").insert({
      store_id: order.store_id, order_id: order.id,
      provider: "mercadopago", external_id: dataIdFromUrl,
      event_type: eventType, raw_status: mpStatus,
      processed: result.processed, error: result.error ?? null,
    });

    return new Response("ok", { status: 200 });
  }

  // ── Processar pagamento de ASSINATURA DA PLATAFORMA ──────────────────
  // Nenhum pedido de loja encontrado — verificar se é assinatura via token da plataforma
  if (!platformToken) {
    console.warn("[webhook] MP_PLATFORM_ACCESS_TOKEN não configurado — não é possível processar assinaturas");
    await supabase.from("webhook_logs").insert({
      provider: "mercadopago", external_id: dataIdFromUrl,
      event_type: eventType, raw_status: "no_platform_token",
      processed: false, error: "No platform token to process subscription",
    });
    return new Response("ok", { status: 200 });
  }

  // Confirmar status com o MP usando token da plataforma
  const mpPlatformRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataIdFromUrl}`, {
    headers: { Authorization: `Bearer ${platformToken}` },
  });
  const mpPlatformPayment = await mpPlatformRes.json();
  const mpPlatformStatus: string = mpPlatformPayment.status ?? "unknown";
  const metadata = mpPlatformPayment.metadata ?? {};
  const preferenceId: string = mpPlatformPayment.preference_id ?? "";

  console.log("[webhook] MP platform payment status:", mpPlatformStatus, "type:", metadata.type, "preference_id:", preferenceId);

  // Se o metadata.type não for 'subscription', não é um pagamento da plataforma
  if (metadata.type !== "subscription") {
    // Pagamento não reconhecido — logar e ignorar
    await supabase.from("webhook_logs").insert({
      provider: "mercadopago", external_id: dataIdFromUrl,
      event_type: eventType, raw_status: "unrecognized",
      processed: false, error: "Payment not linked to any order or subscription",
    });
    return new Response("ok", { status: 200 });
  }

  // Encontrar o subscription_payment pela preference_id (criado no checkout)
  let subPaymentId: string | null = null;

  if (existingSubPayment) {
    subPaymentId = existingSubPayment.id;
  } else if (preferenceId) {
    const { data: subByPref } = await supabase
      .from("subscription_payments")
      .select("id, status")
      .eq("mp_preference_id", preferenceId)
      .maybeSingle();

    if (subByPref) {
      subPaymentId = subByPref.id;
      if (subByPref.status === "paid") {
        console.log("[webhook] subscription already paid via preference:", preferenceId);
        return new Response("ok", { status: 200 });
      }
    }
  }

  // Determinar novo status
  let newStatus: string | null = null;
  if (mpPlatformStatus === "approved") newStatus = "paid";
  else if (mpPlatformStatus === "rejected" || mpPlatformStatus === "cancelled") newStatus = "failed";
  else if (mpPlatformStatus === "pending" || mpPlatformStatus === "in_process") newStatus = "pending";

  if (subPaymentId && newStatus) {
    const { data: subPaymentData, error: updateErr } = await supabase
      .from("subscription_payments")
      .update({
        mp_payment_id: dataIdFromUrl,
        mp_status: mpPlatformStatus,
        status: newStatus,
      })
      .eq("id", subPaymentId)
      .select("store_id, affiliate_id, plan_id, plan_price_cents")
      .single();

    if (updateErr) {
      console.error("[webhook] Erro ao atualizar subscription_payment:", updateErr.message);
    } else {
      console.log(`✅ [webhook] subscription_payment ${subPaymentId} → status=${newStatus}`);
      const targetStoreId = subPaymentData?.store_id || metadata.store_id;
      if (newStatus === "paid" && targetStoreId) {
        // Ativar loja
        await supabase
          .from("stores")
          .update({ status: "active" })
          .eq("id", targetStoreId);
        console.log(`🚀 [webhook] Loja ${targetStoreId} ativada com sucesso!`);

        // ── Gerar comissão de afiliado (idempotente) ───────────────────────
        const affiliateId = subPaymentData?.affiliate_id || metadata.affiliate_id;
        if (affiliateId) {
          // Buscar taxa de comissão do afiliado
          const { data: affiliateRow } = await supabase
            .from("affiliates")
            .select("id, commission_rate, status")
            .eq("id", affiliateId)
            .maybeSingle();

          if (affiliateRow && affiliateRow.status === "active") {
            const paymentAmountCents = subPaymentData?.plan_price_cents
              ?? Math.round((mpPlatformPayment.transaction_amount ?? 0) * 100);
            const commissionRate = Number(affiliateRow.commission_rate);
            const commissionAmountCents = Math.floor(paymentAmountCents * commissionRate / 100);

            const { error: commErr } = await supabase
              .from("affiliate_commissions")
              .insert({
                affiliate_id: affiliateId,
                store_id: targetStoreId,
                payment_id: subPaymentId,
                plan_id: subPaymentData?.plan_id ?? metadata.plan_id ?? "profissional",
                payment_amount_cents: paymentAmountCents,
                commission_rate: commissionRate,
                commission_amount_cents: commissionAmountCents,
                status: "available",
              });

            if (commErr) {
              // Unique constraint violation = já gerou comissão (idempotência)
              if (commErr.code === "23505") {
                console.log("[webhook] Comissão já gerada para este pagamento, ignorando.");
              } else {
                console.error("[webhook] Erro ao gerar comissão de afiliado:", commErr.message);
              }
            } else {
              console.log(`💜 [webhook] Comissão R$ ${(commissionAmountCents / 100).toFixed(2)} gerada para afiliado ${affiliateId}`);
            }
          }
        }
      }
    }
  } else if (!subPaymentId) {
    // Pagamento de assinatura sem registro prévio — criar registro retroativo
    console.warn("[webhook] subscription payment sem registro prévio, criando retroativamente");
    const { error: insertErr } = await supabase.from("subscription_payments").insert({
      name: metadata.name ?? "Desconhecido",
      whatsapp: metadata.whatsapp ?? "",
      email: metadata.email ?? null,
      plan_id: metadata.plan_id ?? "profissional",
      plan_price_cents: Math.round((mpPlatformPayment.transaction_amount ?? 0) * 100),
      mp_preference_id: preferenceId,
      mp_payment_id: dataIdFromUrl,
      mp_status: mpPlatformStatus,
      status: newStatus ?? "pending",
      utm_source: metadata.utm_source ?? null,
      utm_medium: metadata.utm_medium ?? null,
      utm_campaign: metadata.utm_campaign ?? null,
      utm_content: metadata.utm_content ?? null,
      fbclid: metadata.fbclid ?? null,
      ...(metadata.affiliate_id ? { affiliate_id: metadata.affiliate_id } : {}),
    });
    if (insertErr) console.error("[webhook] Erro ao criar subscription_payment retroativo:", insertErr.message);
  }

  await supabase.from("webhook_logs").insert({
    provider: "mercadopago", external_id: dataIdFromUrl,
    event_type: eventType, raw_status: mpPlatformStatus,
    processed: !!newStatus, error: null,
  });

  return new Response("ok", { status: 200 });
});


// ─── Signature Validation ────────────────────────────────────────────────────────
async function validateSignature(
  signature: string | null,
  requestId: string | null,
  dataId: string | null,
  secret: string | null
): Promise<boolean> {
  if (!secret) {
    console.error("[sig] MP_WEBHOOK_SECRET not set in environment!");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const isLocal = supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");
    if (isLocal) {
      console.warn("[sig] Running locally, skipping signature validation.");
      return true;
    }
    return false;
  }
  if (!signature) {
    console.warn("[sig] no x-signature header present");
    return false;
  }
  try {
    const parts: Record<string, string> = {};
    signature.split(",").forEach((p) => {
      const idx = p.indexOf("=");
      if (idx > 0) parts[p.slice(0, idx).trim()] = p.slice(idx + 1).trim();
    });
    const ts = parts["ts"];
    const v1 = parts["v1"];
    if (!ts || !v1) { console.warn("[sig] missing ts or v1 in x-signature"); return false; }

    const template = `id:${dataId ?? ""};request-id:${requestId ?? ""};ts:${ts};`;
    console.log("[sig] validating template:", template);

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(template));
    const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    console.log("[sig] expected:", expected, "got:", v1, "match:", expected === v1);
    return expected === v1;
  } catch (e) {
    console.error("[sig] error:", e.message);
    return false;
  }
}

// ─── Process Order Payment Status ────────────────────────────────────────────────
async function processOrderPaymentStatus(
  supabase: any,
  order: { id: string; store_id: string; payment_status: string } | null,
  orderId: string | null,
  mpStatus: string
): Promise<{ processed: boolean; error?: string }> {
  let targetOrder = order;
  if (!targetOrder && orderId) {
    const { data } = await supabase.from("orders").select("id, store_id, payment_status").eq("id", orderId).maybeSingle();
    targetOrder = data;
  }
  if (!targetOrder) return { processed: false, error: "Order not found" };

  let paymentStatus: string | null = null;
  let orderStatus: string | null = null;
  if (mpStatus === "approved") { paymentStatus = "paid"; orderStatus = "preparing"; }
  else if (mpStatus === "rejected" || mpStatus === "cancelled") { paymentStatus = "unpaid"; }
  else if (mpStatus === "pending" || mpStatus === "in_process") { paymentStatus = "pending"; }

  if (!paymentStatus) return { processed: false, error: `Unhandled MP status: ${mpStatus}` };
  if (paymentStatus === targetOrder.payment_status) return { processed: false };

  const updatePayload: Record<string, string> = { payment_status: paymentStatus };
  if (orderStatus) updatePayload.status = orderStatus;

  const { error: updateErr } = await supabase.from("orders").update(updatePayload).eq("id", targetOrder.id);
  if (updateErr) return { processed: false, error: updateErr.message };

  console.log(`✅ [webhook] Order ${targetOrder.id} → payment_status=${paymentStatus}${orderStatus ? `, status=${orderStatus}` : ""}`);

  if (paymentStatus === "paid") {
    supabase.functions.invoke("send-notification", {
      body: { event: "payment_confirmed", order_id: targetOrder.id }
    }).catch((err: any) => console.error("Failed to invoke send-notification", err));
  }

  return { processed: true };
}

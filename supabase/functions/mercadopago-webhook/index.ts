import { createClient } from "jsr:@supabase/supabase-js@2";

// Original plan prices in cents BEFORE any coupon discount
const ORIGINAL_PLAN_PRICES_CENTS: Record<string, number> = {
  basico: 4700,
  profissional: 8900,
  plus: 15900,
};

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

  if (body.action === "simulate_subscription") {
    const secret = req.headers.get("x-simulate-secret");
    if (!secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }
    const { subscription_payment_id, store_id } = body;
    let targetSubPayment = null;
    if (subscription_payment_id) {
      const { data } = await supabase.from("subscription_payments").select("*").eq("id", subscription_payment_id).maybeSingle();
      targetSubPayment = data;
    } else if (store_id) {
      const { data } = await supabase.from("subscription_payments").select("*").eq("store_id", store_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      targetSubPayment = data;
    }

    if (!targetSubPayment) {
      return new Response(JSON.stringify({ error: "Subscription payment record not found" }), { status: 400 });
    }

    // Mark subscription payment as paid
    await supabase.from("subscription_payments").update({ status: "paid" }).eq("id", targetSubPayment.id);

    // Activate store
    const targetStoreId = targetSubPayment.store_id;
    if (targetStoreId) {
      await supabase.from("stores").update({ status: "active" }).eq("id", targetStoreId);
    }

    // Generate affiliate commission if applicable (using original plan price BEFORE discount)
    const affiliateId = targetSubPayment.affiliate_id;
    let commissionCreated = false;
    if (affiliateId && targetStoreId) {
      const { data: aff } = await supabase.from("affiliates").select("id, commission_rate, status").eq("id", affiliateId).maybeSingle();
      if (aff && aff.status === "active") {
        const planId = targetSubPayment.plan_id || "profissional";
        const originalPlanPriceCents = ORIGINAL_PLAN_PRICES_CENTS[planId] || 8900;

        // Dynamic Tier rate calculation based on active store count
        const { count: activeCount } = await supabase
          .from("stores")
          .select("id", { count: "exact", head: true })
          .eq("affiliate_id", affiliateId)
          .eq("status", "active");

        const nActive = activeCount ?? 0;
        let commRate = 20.0;
        if (nActive >= 50) commRate = 30.0;
        else if (nActive >= 30) commRate = 27.5;
        else if (nActive >= 15) commRate = 25.0;
        else if (nActive >= 5) commRate = 22.5;
        else commRate = Math.max(20.0, Number(aff.commission_rate) || 20.0);

        const commCents = Math.floor(originalPlanPriceCents * commRate / 100);

        const { error: commErr } = await supabase.from("affiliate_commissions").insert({
          affiliate_id: affiliateId,
          store_id: targetStoreId,
          payment_id: targetSubPayment.id,
          plan_id: planId,
          payment_amount_cents: originalPlanPriceCents,
          commission_rate: commRate,
          commission_amount_cents: commCents,
          status: "available",
        });
        if (!commErr) commissionCreated = true;
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      subscription_payment_id: targetSubPayment.id,
      store_id: targetStoreId,
      store_activated: true,
      commission_created: commissionCreated,
    }), { headers: { "Content-Type": "application/json" } });
  }

  if (body.action === "simulate_cancellation" || body.action === "simulate_refund") {
    const secret = req.headers.get("x-simulate-secret");
    if (!secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }
    const { subscription_payment_id, store_id } = body;
    let targetSubPayment = null;
    if (subscription_payment_id) {
      const { data } = await supabase.from("subscription_payments").select("*").eq("id", subscription_payment_id).maybeSingle();
      targetSubPayment = data;
    } else if (store_id) {
      const { data } = await supabase.from("subscription_payments").select("*").eq("store_id", store_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      targetSubPayment = data;
    }

    if (!targetSubPayment) {
      return new Response(JSON.stringify({ error: "Subscription payment record not found" }), { status: 400 });
    }

    const newPaymentStatus = body.action === "simulate_refund" ? "failed" : "cancelled";
    await supabase.from("subscription_payments").update({
      status: newPaymentStatus,
      mp_status: body.action === "simulate_refund" ? "refunded" : "cancelled",
    }).eq("id", targetSubPayment.id);

    const targetStoreId = targetSubPayment.store_id;
    if (targetStoreId) {
      await supabase.from("stores").update({ status: "suspended" }).eq("id", targetStoreId);
    }

    const { error: revertErr, data: revertedRows } = await supabase
      .from("affiliate_commissions")
      .update({ status: "reverted" })
      .eq("payment_id", targetSubPayment.id)
      .in("status", ["available", "pending"])
      .select("id");

    return new Response(JSON.stringify({
      ok: true,
      action: body.action,
      subscription_payment_id: targetSubPayment.id,
      store_id: targetStoreId,
      store_suspended: true,
      reverted_commissions_count: revertedRows?.length ?? 0,
      reverted: true,
    }), { headers: { "Content-Type": "application/json" } });
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
  else if (mpPlatformStatus === "rejected" || mpPlatformStatus === "cancelled" || mpPlatformStatus === "refunded" || mpPlatformStatus === "charged_back") newStatus = "failed";
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

        // ── Gerar comissão de afiliado (idempotente com faixas e limite de 12 meses) ──
        const affiliateId = subPaymentData?.affiliate_id || metadata.affiliate_id;
        if (affiliateId) {
          // 1. Verificar idade da loja (limite de 12 meses para recorrência)
          const { data: storeRow } = await supabase
            .from("stores")
            .select("created_at")
            .eq("id", targetStoreId)
            .maybeSingle();

          let isWithin12Months = true;
          if (storeRow?.created_at) {
            const storeCreatedAt = new Date(storeRow.created_at).getTime();
            const daysAge = (Date.now() - storeCreatedAt) / (1000 * 60 * 60 * 24);
            if (daysAge > 365) {
              isWithin12Months = false;
              console.log(`[webhook] Loja ${targetStoreId} possui ${Math.round(daysAge)} dias (> 365 dias). Comissão encerrada.`);
            }
          }

          if (isWithin12Months) {
            // 2. Buscar dados do afiliado
            const { data: affiliateRow } = await supabase
              .from("affiliates")
              .select("id, commission_rate, status")
              .eq("id", affiliateId)
              .maybeSingle();

            if (affiliateRow && affiliateRow.status === "active") {
              // 3. Contar número de lojas ativas indicadas por este afiliado para definir a faixa
              const { count: activeCount } = await supabase
                .from("stores")
                .select("id", { count: "exact", head: true })
                .eq("affiliate_id", affiliateId)
                .eq("status", "active");

              // Faixas: 1-4: 20%, 5-14: 22.5%, 15-29: 25%, 30-49: 27.5%, 50+: 30%
              const nActive = activeCount ?? 0;
              let effectiveRate = 20.0;
              if (nActive >= 50) effectiveRate = 30.0;
              else if (nActive >= 30) effectiveRate = 27.5;
              else if (nActive >= 15) effectiveRate = 25.0;
              else if (nActive >= 5) effectiveRate = 22.5;
              else effectiveRate = Math.max(20.0, Number(affiliateRow.commission_rate) || 20.0);

              const planId = subPaymentData?.plan_id ?? metadata.plan_id ?? "profissional";
              const originalPlanPriceCents = ORIGINAL_PLAN_PRICES_CENTS[planId] || 8900;
              const commissionAmountCents = Math.floor(originalPlanPriceCents * effectiveRate / 100);

              const { error: commErr } = await supabase
                .from("affiliate_commissions")
                .insert({
                  affiliate_id: affiliateId,
                  store_id: targetStoreId,
                  payment_id: subPaymentId,
                  plan_id: planId,
                  payment_amount_cents: originalPlanPriceCents,
                  commission_rate: effectiveRate,
                  commission_amount_cents: commissionAmountCents,
                  status: "available",
                });

              if (commErr) {
                if (commErr.code === "23505") {
                  console.log("[webhook] Comissão já gerada para este pagamento, ignorando.");
                } else {
                  console.error("[webhook] Erro ao gerar comissão de afiliado:", commErr.message);
                }
              } else {
                console.log(`💜 [webhook] Comissão R$ ${(commissionAmountCents / 100).toFixed(2)} (${effectiveRate}% faixa ${nActive} lojas) gerada para afiliado ${affiliateId}`);
              }
            }
          }
        }
      }

      // ── Reverter comissão se pagamento foi cancelado/rejeitado/estornado ───────────────
      if (newStatus === "failed" || newStatus === "refunded") {
        console.log(`[webhook] Pagamento ${subPaymentId} ${newStatus}. Revertendo comissões...`);
        const { error: revertErr } = await supabase
          .from("affiliate_commissions")
          .update({ status: "reverted" })
          .eq("payment_id", subPaymentId)
          .in("status", ["available", "pending"]);

        if (revertErr) {
          console.error("[webhook] Erro ao reverter comissões:", revertErr.message);
        } else {
          console.log(`↩️ [webhook] Comissões revertidas para payment_id=${subPaymentId}`);
        }

        if (targetStoreId) {
          await supabase
            .from("stores")
            .update({ status: "suspended" })
            .eq("id", targetStoreId);
          console.log(`🔒 [webhook] Loja ${targetStoreId} suspensa devido a ${newStatus}.`);
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

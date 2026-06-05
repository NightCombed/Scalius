import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

/**
 * resend-webhook — Endpoint para receber eventos do Resend via Svix.
 *
 * Fluxo:
 *  1. Valida a assinatura HMAC-SHA256 do Svix (rejeita requests não autorizados)
 *  2. Persiste bounces/complaints em email_suppressions (upsert idempotente)
 *  3. Responde HTTP 200 em caso de sucesso ou falha de DB controlada
 *     — em caso de falha de DB retorna 500 para que o Resend reenvie (até 5x)
 *
 * Env vars necessárias:
 *   RESEND_WEBHOOK_SECRET  — Signing secret do webhook (Resend Dashboard → Webhooks → Signing Secret)
 *   SUPABASE_URL           — Injetado automaticamente pelo runtime
 *   SUPABASE_SERVICE_ROLE_KEY — Injetado automaticamente pelo runtime
 */

// ─── Svix Signature Verification ──────────────────────────────────────────────

async function verifyResendSignature(
  body: string,
  headers: Headers,
  secret: string,
): Promise<boolean> {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn("[resend-webhook] Missing Svix headers");
    return false;
  }

  // Rejeita timestamps com mais de 5 minutos (protege contra replay attacks)
  const ts = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    console.warn("[resend-webhook] Svix timestamp expired or invalid:", svixTimestamp);
    return false;
  }

  // Decodifica o secret (formato: "whsec_<base64>")
  const secretBase64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let secretBytes: Uint8Array;
  try {
    secretBytes = Uint8Array.from(atob(secretBase64), (c) => c.charCodeAt(0));
  } catch {
    console.error("[resend-webhook] Failed to decode webhook secret");
    return false;
  }

  // Constrói a mensagem assinada: "<svix-id>.<svix-timestamp>.<body>"
  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(toSign),
  );
  const computedSig = `v1,${btoa(String.fromCharCode(...new Uint8Array(sigBytes)))}`;

  // svix-signature pode conter múltiplas assinaturas separadas por espaço
  const expectedSigs = svixSignature.split(" ");
  const valid = expectedSigs.some((s) => s === computedSig);
  if (!valid) {
    console.warn("[resend-webhook] Signature mismatch. computed:", computedSig);
  }
  return valid;
}

// ─── Handler Principal ─────────────────────────────────────────────────────────

serve(async (req) => {
  // Lê o body antes de qualquer branch — necessário para a verificação de assinatura
  const body = await req.text();

  // ── Health check ──────────────────────────────────────────────────────────
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "resend-webhook" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");

  // ── Verificação de assinatura ─────────────────────────────────────────────
  if (webhookSecret) {
    const isValid = await verifyResendSignature(body, req.headers, webhookSecret);
    if (!isValid) {
      console.error("[resend-webhook] Invalid signature — request rejected");
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    // Se não há secret configurado, aceita mas loga aviso (modo inseguro)
    console.warn(
      "[resend-webhook] RESEND_WEBHOOK_SECRET not configured — signature verification skipped",
    );
  }

  // ── Parse do payload ──────────────────────────────────────────────────────
  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    console.error("[resend-webhook] Failed to parse JSON body");
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventType: string = payload?.type ?? "";
  const emailId: string = payload?.data?.email_id ?? "";
  const toAddresses: string[] = Array.isArray(payload?.data?.to)
    ? payload.data.to
    : payload?.data?.to
    ? [payload.data.to]
    : [];

  console.log("[resend-webhook] Event received:", eventType, "| email_id:", emailId, "| to:", toAddresses.join(", "));

  // ── Inicializa Supabase (service role) ────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── Processa eventos que exigem supressão ─────────────────────────────────
  const suppressionEvents: Record<string, "bounced" | "complained"> = {
    "email.bounced": "bounced",
    "email.complained": "complained",
  };

  if (suppressionEvents[eventType] && toAddresses.length > 0) {
    const reason = suppressionEvents[eventType];

    const records = toAddresses.map((email) => ({
      email: email.toLowerCase().trim(),
      reason,
      resend_email_id: emailId || null,
      resend_event: eventType,
      suppressed_at: new Date().toISOString(),
    }));

    try {
      const { error: upsertError } = await supabase
        .from("email_suppressions")
        .upsert(records, {
          onConflict: "email",
          ignoreDuplicates: false, // atualiza o reason se já existia com outro motivo
        });

      if (upsertError) {
        // Retorna 500: Resend vai retentar (o upsert é idempotente, então retries são seguros)
        console.error(
          "[resend-webhook] DB upsert failed — returning 500 for Resend retry:",
          upsertError.message,
        );
        return new Response(
          JSON.stringify({ error: "Database error — will retry", detail: upsertError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      console.log(
        `[resend-webhook] Suppressed ${toAddresses.length} address(es) as '${reason}':`,
        toAddresses.join(", "),
      );

      // Tenta encontrar a store_id e order_id a partir do log original do envio do e-mail
      let resolvedStoreId: string | null = null;
      let resolvedOrderId: string | null = null;

      if (emailId) {
        try {
          const { data: originalLog, error: lookupError } = await supabase
            .from("notification_logs")
            .select("store_id, order_id")
            .eq("metadata->result->>messageId", emailId)
            .limit(1)
            .maybeSingle();

          if (lookupError) {
            console.warn("[resend-webhook] Error looking up original notification log:", lookupError.message);
          } else if (originalLog) {
            resolvedStoreId = originalLog.store_id;
            resolvedOrderId = originalLog.order_id;
            console.log(`[resend-webhook] Resolved store_id: ${resolvedStoreId} and order_id: ${resolvedOrderId} from original email_id: ${emailId}`);
          } else {
            console.log(`[resend-webhook] No original notification log found for email_id: ${emailId}`);
          }
        } catch (err: any) {
          console.warn("[resend-webhook] Failed to query original log:", err.message);
        }
      }

      // Loga também na notification_logs para rastreabilidade no painel (apenas se resolveu a store_id)
      if (resolvedStoreId) {
        await supabase.from("notification_logs").insert({
          store_id: resolvedStoreId,
          order_id: resolvedOrderId,
          event_type: eventType,
          channel: "email",
          recipient_type: reason === "bounced" ? "bounced_address" : "complained_address",
          status: reason,
          error_message: null,
          metadata: {
            resend_email_id: emailId,
            suppressed_emails: toAddresses,
            event: payload,
          },
        }).throwOnError().catch((e: any) => {
          // Falha de log é não-crítica — a supressão já foi salva
          console.warn("[resend-webhook] notification_logs insert failed (non-critical):", e.message);
        });
      } else {
        console.warn("[resend-webhook] Skipping notification_logs insert because store_id could not be resolved for emailId:", emailId);
      }

    } catch (err: any) {
      console.error("[resend-webhook] Unexpected error processing suppression:", err.message);
      return new Response(
        JSON.stringify({ error: "Unexpected server error", detail: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  } else {
    // Evento não crítico (email.sent, email.delivered, email.opened, etc.)
    console.log("[resend-webhook] Non-suppression event — acknowledged:", eventType);
  }

  // ── Responde 200 para o Resend ────────────────────────────────────────────
  return new Response(
    JSON.stringify({ received: true, type: eventType }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

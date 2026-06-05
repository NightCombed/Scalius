import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

/**
 * send-email-ses — Wrapper de envio de e-mail via Resend.
 *
 * Ordem de execução:
 *  1. Valida campos obrigatórios
 *  2. Consulta email_suppressions — aborta antes de consumir quota se endereço estiver suprimido
 *  3. Chama a API do Resend
 *  4. Detecta e sinaliza rate-limit (HTTP 429) com flag explícita para send-notification logar corretamente
 *
 * Env vars:
 *   RESEND_API_KEY            — chave de API do Resend
 *   SUPABASE_URL              — injetado automaticamente
 *   SUPABASE_SERVICE_ROLE_KEY — injetado automaticamente
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | string[];
  fromName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: SendEmailPayload = await req.json();
    const { to, subject, html, replyTo } = payload;

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY in environment");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const toAddresses = Array.isArray(to) ? to : [to];
    const normalizedAddresses = toAddresses.map((e) => e.toLowerCase().trim());

    // ── 1. CHECAGEM DE SUPRESSÃO (pré-envio) ────────────────────────────────
    // Consulta a lista de supressão antes de consumir qualquer quota do Resend.
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: suppressions, error: suppressionError } = await supabase
        .from("email_suppressions")
        .select("email, reason")
        .in("email", normalizedAddresses);

      if (suppressionError) {
        // Falha de consulta não bloqueia o envio — logamos e continuamos
        console.warn(
          "[send-email-ses] Could not query email_suppressions (non-blocking):",
          suppressionError.message,
        );
      } else if (suppressions && suppressions.length > 0) {
        const suppressedEmails = suppressions.map((s: any) => s.email);
        const reason: string = suppressions[0].reason;
        console.warn(
          `[send-email-ses] ABORTED — address(es) suppressed (${reason}): ${suppressedEmails.join(", ")}`,
        );
        // HTTP 200 com flag suppressed=true — send-notification interpreta e loga como "suppressed"
        return new Response(
          JSON.stringify({
            success: false,
            suppressed: true,
            suppressedEmails,
            reason,
            error: `Email address suppressed: ${reason}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // ── 2. ENVIO VIA RESEND ─────────────────────────────────────────────────
    const replyToAddresses = replyTo
      ? Array.isArray(replyTo) ? replyTo : [replyTo]
      : undefined;

    const requestBody: Record<string, unknown> = {
      from: "Scalius <notificacoes@scalius.com.br>",
      to: toAddresses,
      subject,
      html,
    };
    if (replyToAddresses && replyToAddresses.length > 0) {
      requestBody.reply_to = replyToAddresses;
    }

    console.log(
      `[send-email-ses] Sending via Resend → to: ${toAddresses.join(", ")} | subject: "${subject}"`,
    );

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    // ── 3. DETECÇÃO EXPLÍCITA DE RATE LIMIT (429) ───────────────────────────
    // Retorna HTTP 429 com flag rateLimited=true para que send-notification
    // possa logar status="rate_limited" em vez de status="error" genérico.
    if (response.status === 429) {
      console.error("[send-email-ses] RATE LIMITED by Resend (quota diária atingida):", responseText);
      return new Response(
        JSON.stringify({
          success: false,
          rateLimited: true,
          error: `rate_limited: ${responseText}`,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!response.ok) {
      console.error("[send-email-ses] Resend API error:", responseText);
      throw new Error(`Resend Error: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log("[send-email-ses] Success. Resend messageId:", result.id);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[send-email-ses] Function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

/**
 * alert-critical-errors — Verifica erros críticos recentes e envia alertas por e-mail.
 *
 * Pode ser chamada:
 *  - Via webhook/cron do Supabase (POST sem body)
 *  - Manualmente pelo Super Admin via dashboard
 *
 * Env vars:
 *   RESEND_API_KEY            — chave de API do Resend
 *   SUPER_ADMIN_ALERT_EMAIL   — destinatário dos alertas (default: luixlima2010p@gmail.com)
 *   SUPABASE_URL              — injetado automaticamente
 *   SUPABASE_SERVICE_ROLE_KEY — injetado automaticamente
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALERT_EMAIL = "luixlima2010p@gmail.com";
const WINDOW_MINUTES = 60; // janela de verificação: última 1h

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    // ── 1. Buscar erros de cliente críticos na janela ──────────────────────
    const { data: clientErrors, error: ceErr } = await supabase
      .from("client_error_logs")
      .select("id, store_id, error_message, url, created_at, metadata, stack_trace")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (ceErr) throw ceErr;

    // ── 2. Buscar nomes das lojas para exibição ────────────────────────────
    const storeIds = [...new Set((clientErrors ?? []).map((e) => e.store_id).filter(Boolean))];
    let storeNames: Record<string, string> = {};

    if (storeIds.length > 0) {
      const { data: stores } = await supabase
        .from("stores")
        .select("id, name, slug")
        .in("id", storeIds);
      for (const s of stores ?? []) {
        storeNames[s.id] = `${s.name} (${s.slug}.scalius.com.br)`;
      }
    }

    const totalErrors = (clientErrors ?? []).length;

    if (totalErrors === 0) {
      console.log("[alert-critical-errors] Nenhum erro crítico na janela. Nada a alertar.");
      return new Response(
        JSON.stringify({ ok: true, alerted: false, message: "Nenhum erro crítico encontrado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 3. Montar e-mail HTML ──────────────────────────────────────────────
    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const errorRows = (clientErrors ?? [])
      .slice(0, 20) // máximo 20 no e-mail
      .map((e) => {
        const store = e.store_id ? (storeNames[e.store_id] ?? e.store_id) : "—";
        const errTime = new Date(e.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const stack = e.stack_trace
          ? `<details style="margin-top:4px"><summary style="cursor:pointer;color:#6366f1;font-size:11px">Ver stack trace</summary><pre style="font-size:10px;white-space:pre-wrap;color:#64748b;background:#f8fafc;padding:8px;border-radius:4px;max-height:120px;overflow:auto">${escapeHtml(e.stack_trace)}</pre></details>`
          : "";
        return `
          <tr style="border-bottom:1px solid #e2e8f0">
            <td style="padding:8px 12px;font-size:12px;color:#475569">${errTime}</td>
            <td style="padding:8px 12px;font-size:12px;color:#1e293b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(store)}">${escapeHtml(store)}</td>
            <td style="padding:8px 12px;font-size:12px;color:#dc2626;font-weight:500;max-width:300px">${escapeHtml(e.error_message ?? "erro desconhecido")}${stack}</td>
            <td style="padding:8px 12px;font-size:11px;color:#94a3b8;max-width:200px;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml(e.url ?? '')}">${escapeHtml(e.url ?? "—")}</td>
          </tr>`;
      })
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:700px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:24px 32px">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:28px">🚨</span>
        <div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Alerta de Erros Críticos</h1>
          <p style="margin:4px 0 0;color:#c4b5fd;font-size:13px">Scalius — Painel de Monitoramento</p>
        </div>
      </div>
    </div>

    <!-- Stats bar -->
    <div style="background:#fef2f2;border-bottom:2px solid #fecaca;padding:16px 32px;display:flex;gap:32px;align-items:center">
      <div>
        <p style="margin:0;font-size:28px;font-weight:700;color:#dc2626">${totalErrors}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#991b1b;text-transform:uppercase;letter-spacing:.5px">erros detectados</p>
      </div>
      <div style="height:40px;width:1px;background:#fecaca"></div>
      <div>
        <p style="margin:0;font-size:14px;color:#7f1d1d">Janela: <strong>última ${WINDOW_MINUTES} minutos</strong></p>
        <p style="margin:4px 0 0;font-size:12px;color:#991b1b">Gerado em ${now} (BRT)</p>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:24px 32px">
      <p style="margin:0 0 16px;color:#475569;font-size:14px">
        Os seguintes erros de frontend foram capturados pela plataforma Scalius nas últimas <strong>${WINDOW_MINUTES} minutos</strong>.
        Verifique o painel de monitoramento para mais detalhes.
      </p>

      <div style="overflow-x:auto;border-radius:8px;border:1px solid #e2e8f0">
        <table style="width:100%;border-collapse:collapse;font-family:inherit">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap">Hora</th>
              <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Loja</th>
              <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Erro</th>
              <th style="padding:10px 12px;font-size:11px;color:#64748b;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:.5px">URL</th>
            </tr>
          </thead>
          <tbody>
            ${errorRows}
          </tbody>
        </table>
      </div>

      ${totalErrors > 20 ? `<p style="margin:12px 0 0;font-size:12px;color:#94a3b8;text-align:center">Mostrando os 20 erros mais recentes de ${totalErrors} total. Acesse o painel para ver todos.</p>` : ""}

      <!-- CTA -->
      <div style="margin-top:24px;text-align:center">
        <a href="https://scalius.com.br/super-admin" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          🔍 Abrir Painel de Monitoramento
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center">
      <p style="margin:0;font-size:11px;color:#94a3b8">
        Este e-mail foi gerado automaticamente pelo sistema de monitoramento da Scalius.<br>
        Destinado exclusivamente ao Super Admin da plataforma.
      </p>
    </div>
  </div>
</body>
</html>`;

    // ── 4. Enviar alerta via Resend ────────────────────────────────────────
    if (!resendApiKey) {
      console.warn("[alert-critical-errors] RESEND_API_KEY não configurada. E-mail não enviado.");
      return new Response(
        JSON.stringify({ ok: true, alerted: false, totalErrors, message: "RESEND_API_KEY não configurada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const alertEmail = Deno.env.get("SUPER_ADMIN_ALERT_EMAIL") ?? ALERT_EMAIL;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Scalius Monitor <notificacoes@scalius.com.br>",
        to: [alertEmail],
        subject: `🚨 [Scalius] ${totalErrors} erro${totalErrors > 1 ? "s" : ""} crítico${totalErrors > 1 ? "s" : ""} detectado${totalErrors > 1 ? "s" : ""} — ${now}`,
        html,
      }),
    });

    const resendText = await resendResponse.text();

    if (!resendResponse.ok) {
      console.error("[alert-critical-errors] Resend error:", resendText);
      return new Response(
        JSON.stringify({ ok: false, alerted: false, totalErrors, error: `Resend: ${resendText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resendResult = JSON.parse(resendText);
    console.log(`[alert-critical-errors] Alerta enviado para ${alertEmail}. messageId: ${resendResult.id}. Erros: ${totalErrors}`);

    return new Response(
      JSON.stringify({ ok: true, alerted: true, totalErrors, messageId: resendResult.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[alert-critical-errors] Erro fatal:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function escapeHtml(str: string): string {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

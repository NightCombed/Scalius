-- ============================================================
-- email_suppressions: lista de supressão de e-mails
-- Populada automaticamente pelo webhook do Resend (bounced/complained).
-- Consultada pelo send-email-ses antes de cada envio para proteger
-- a quota diária do plano Free (100 e-mails/dia).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email            text        NOT NULL,
  reason           text        NOT NULL CHECK (reason IN ('bounced', 'complained', 'unsubscribed')),
  resend_email_id  text,                          -- ID do e-mail no Resend que gerou o evento
  resend_event     text,                          -- Tipo de evento cru do Resend (ex: "email.bounced")
  suppressed_at    timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT email_suppressions_email_key UNIQUE (email)
);

-- Índice para lookup rápido (consultado em cada envio)
CREATE INDEX IF NOT EXISTS email_suppressions_email_idx
  ON public.email_suppressions (email);

-- RLS habilitado: apenas service_role pode operar nesta tabela
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy pública — acesso exclusivo via service_role key
-- (Edge Functions usam a chave de service role para ler/escrever)

COMMENT ON TABLE public.email_suppressions IS
  'Lista de supressão de e-mails. Alimentada pelo webhook do Resend. '
  'Consultada pelo send-email-ses antes de cada disparo para proteger a quota.';

COMMENT ON COLUMN public.email_suppressions.reason IS
  'bounced = hard bounce; complained = marcou como spam; unsubscribed = descadastrado manualmente';

-- ─── Create Subscription Payments Table ──────────────────────────────────────
-- Registra cada tentativa de pagamento de assinatura da plataforma Scalius.
-- Estruturado para suportar o programa de afiliados no futuro.

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados do lead capturado no formulário da landing page
  lead_id             uuid        REFERENCES public.leads(id) ON DELETE SET NULL,
  name                text        NOT NULL,
  whatsapp            text        NOT NULL,
  email               text,

  -- Plano contratado
  plan_id             text        NOT NULL
                                  CHECK (plan_id IN ('basico', 'profissional', 'plus')),
  plan_price_cents    integer     NOT NULL,

  -- Dados do Mercado Pago
  mp_preference_id    text,       -- ID da preferência criada no Checkout Pro
  mp_payment_id       text,       -- ID do pagamento confirmado (via webhook)
  mp_status           text,       -- status retornado pelo MP ('pending','approved','rejected',...)
  checkout_url        text,       -- URL do Checkout Pro gerada pelo MP

  -- Rastreamento de marketing (UTM + fbclid)
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_content         text,
  fbclid              text,

  -- Reservado para programa de afiliados (não implementado nesta fase)
  affiliate_code      text,

  -- Status interno da assinatura
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_subscription_payments_mp_preference_id
  ON public.subscription_payments(mp_preference_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_mp_payment_id
  ON public.subscription_payments(mp_payment_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_status
  ON public.subscription_payments(status);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_lead_id
  ON public.subscription_payments(lead_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_subscription_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_subscription_payments_updated_at();

-- Row Level Security
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Super admins podem ler tudo
CREATE POLICY "subscription_payments: super_admin select"
  ON public.subscription_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_super_admin = true
    )
  );

-- Inserts são feitos apenas via Edge Functions (service role)
-- Nenhuma policy de INSERT para anon/authenticated — apenas service_role bypassa RLS

COMMENT ON TABLE public.subscription_payments IS
  'Registra tentativas de pagamento de assinatura da plataforma Scalius via Mercado Pago Checkout Pro. Preparado para integração futura com programa de afiliados.';

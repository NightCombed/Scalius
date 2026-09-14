-- ─── Affiliate Program: Core Tables & Schema Extensions ─────────────────────
-- Implementação do Programa de Parceiros/Afiliados do Scalius.
-- Integrado à estrutura existente: auth.users, profiles, stores, subscription_payments.

-- ── 1. Tabela affiliates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliates (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conta de usuário do parceiro (1-para-1 com auth.users)
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Loja normal de demonstração vinculada ao parceiro
  demo_store_id       uuid        REFERENCES public.stores(id) ON DELETE SET NULL,

  -- Código único de indicação: usado como link (?ref=CODE)
  code                text        NOT NULL,

  -- Cupom próprio opcional (ex: SILVA10)
  coupon_code         text        UNIQUE,

  -- Taxa de comissão recorrente em porcentagem (ex: 20.00 = 20%)
  commission_rate     numeric(5,2) NOT NULL DEFAULT 20.00,

  -- Status da parceria
  status              text        NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'suspended', 'terminated')),

  -- Dados de pagamento do parceiro
  pix_key             text,

  -- Notas internas do Super Admin
  notes               text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT affiliates_code_unique UNIQUE (code),
  CONSTRAINT affiliates_user_unique UNIQUE (user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_affiliates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_affiliates_updated_at();

-- ── 2. Adicionar affiliate_id à tabela stores ────────────────────────────────
-- Um cliente (loja) pertence a no máximo UM único parceiro (atribuição única).
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stores_affiliate_id ON public.stores(affiliate_id);

-- ── 3. Adicionar affiliate_id à tabela subscription_payments ────────────────
ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subscription_payments_affiliate_id
  ON public.subscription_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_store_id
  ON public.subscription_payments(store_id);

-- ── 4. Tabela affiliate_commissions ─────────────────────────────────────────
-- Livro-razão financeiro de cada comissão gerada, vinculada a pagamentos reais.
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  affiliate_id            uuid        NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  store_id                uuid        NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  payment_id              uuid        NOT NULL REFERENCES public.subscription_payments(id) ON DELETE CASCADE,

  -- Dados do plano no momento do pagamento (snapshot histórico)
  plan_id                 text        NOT NULL,
  payment_amount_cents    integer     NOT NULL,

  -- Comissão calculada
  commission_rate         numeric(5,2) NOT NULL,
  commission_amount_cents integer     NOT NULL,

  -- Fluxo financeiro da comissão
  status                  text        NOT NULL DEFAULT 'available'
                                      CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),

  paid_at                 timestamptz,
  notes                   text,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- Idempotência: apenas uma comissão por pagamento
  CONSTRAINT affiliate_commissions_payment_unique UNIQUE (payment_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id
  ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_store_id
  ON public.affiliate_commissions(store_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status
  ON public.affiliate_commissions(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_affiliate_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_affiliate_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_affiliate_commissions_updated_at();

-- ── 5. Row Level Security ───────────────────────────────────────────────────

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Super admins podem ver e editar tudo em affiliates
CREATE POLICY "affiliates: super_admin all"
  ON public.affiliates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_super_admin = true
    )
  );

-- O próprio parceiro pode ver seu próprio registro
CREATE POLICY "affiliates: self select"
  ON public.affiliates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Super admins podem ver e editar todas as comissões
CREATE POLICY "affiliate_commissions: super_admin all"
  ON public.affiliate_commissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_super_admin = true
    )
  );

-- Parceiro pode ver suas próprias comissões
CREATE POLICY "affiliate_commissions: affiliate select"
  ON public.affiliate_commissions FOR SELECT TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.affiliates IS
  'Parceiros/afiliados do programa de indicação do Scalius. Cada parceiro possui um código único (link/cupom) e taxa de comissão recorrente.';

-- Grants de acesso para roles do PostgREST
GRANT ALL ON TABLE public.affiliates TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.affiliate_commissions TO postgres, anon, authenticated, service_role;

COMMENT ON TABLE public.affiliate_commissions IS
  'Livro-razão de comissões geradas para parceiros. Cada linha representa uma comissão calculada a partir de um pagamento de assinatura confirmado.';

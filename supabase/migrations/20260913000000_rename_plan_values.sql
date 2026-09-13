-- ─── Rename Plan Values ──────────────────────────────────────────────────────
-- Alinha os valores da coluna stores.plan com os nomes exibidos na landing page.
-- 'essencial' → 'profissional'
-- 'pro'       → 'plus'
-- 'basico'    permanece 'basico'

-- 1. Migrar dados existentes
UPDATE public.stores SET plan = 'profissional' WHERE plan = 'essencial';
UPDATE public.stores SET plan = 'plus'         WHERE plan = 'pro';

-- 2. Atualizar constraint CHECK
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_plan_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_plan_check
  CHECK (plan IN ('basico', 'profissional', 'plus'));

COMMENT ON COLUMN public.stores.plan IS
  'Subscription plan for the store. Managed by platform super-admins only. Values: basico | profissional | plus';

-- 3. Atualizar função de limite de membros
CREATE OR REPLACE FUNCTION public.check_store_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan text;
  v_member_count integer;
BEGIN
  SELECT plan INTO v_plan FROM public.stores WHERE id = NEW.store_id;

  IF v_plan = 'basico' THEN
    SELECT count(*) INTO v_member_count FROM public.store_members WHERE store_id = NEW.store_id;
    IF v_member_count >= 1 THEN
      RAISE EXCEPTION 'O plano Básico permite no máximo 1 usuário administrador. Faça upgrade para o plano Profissional para adicionar mais usuários.';
    END IF;
  ELSIF v_plan = 'profissional' THEN
    SELECT count(*) INTO v_member_count FROM public.store_members WHERE store_id = NEW.store_id;
    IF v_member_count >= 2 THEN
      RAISE EXCEPTION 'O plano Profissional permite no máximo 2 usuários administradores. Faça upgrade para o Plano Plus para ter usuários ilimitados.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atualizar função de limite de sessões
CREATE OR REPLACE FUNCTION public.check_session_limit(p_store_id uuid, p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_session_count integer;
BEGIN
  SELECT plan INTO v_plan FROM public.stores WHERE id = p_store_id;

  -- Plus plan: unlimited sessions
  IF v_plan = 'plus' THEN
    RETURN true;
  END IF;

  -- Clean up stale sessions (inactive for > 1 hour) before counting
  DELETE FROM public.store_sessions
  WHERE store_id = p_store_id
    AND last_seen_at < now() - interval '1 hour';

  DELETE FROM public.store_sessions
  WHERE session_token = p_session_token;

  -- Deduplicate: keep only the most recently seen row per (store_id, user_id)
  DELETE FROM public.store_sessions
  WHERE store_id = p_store_id
    AND id NOT IN (
      SELECT DISTINCT ON (store_id, user_id) id
      FROM public.store_sessions
      WHERE store_id = p_store_id
      ORDER BY store_id, user_id, last_seen_at DESC
    );

  SELECT count(*) INTO v_session_count
  FROM public.store_sessions
  WHERE store_id = p_store_id;

  IF v_plan = 'basico' THEN
    RETURN v_session_count < 1;
  ELSE
    -- profissional: max 2 concurrent sessions
    RETURN v_session_count < 2;
  END IF;
END;
$$;

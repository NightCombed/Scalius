-- ─── Add Basico Plan ─────────────────────────────────────────────────────────
-- Adds 'basico' to the check constraint for public.stores.plan.
-- Updates member limit trigger and session limit function.

-- 1. Update Check Constraint
ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_plan_check;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_plan_check CHECK (plan IN ('basico', 'essencial', 'pro'));

COMMENT ON COLUMN public.stores.plan IS 'Subscription plan for the store. Managed by platform super-admins only. Values: basico | essencial | pro';

-- 2. Update Member Limit Trigger Function
CREATE OR REPLACE FUNCTION public.check_store_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan text;
  v_member_count integer;
BEGIN
  -- Get the store plan
  SELECT plan INTO v_plan FROM public.stores WHERE id = NEW.store_id;
  
  -- If plan is basico, check member count (max 1 user)
  IF v_plan = 'basico' THEN
    SELECT count(*) INTO v_member_count FROM public.store_members WHERE store_id = NEW.store_id;
    IF v_member_count >= 1 THEN
      RAISE EXCEPTION 'O plano Básico permite no máximo 1 usuário administrador. Faça upgrade para o plano Profissional para adicionar mais usuários.';
    END IF;
  -- If plan is essencial, check member count (max 2 users)
  ELSIF v_plan = 'essencial' THEN
    SELECT count(*) INTO v_member_count FROM public.store_members WHERE store_id = NEW.store_id;
    IF v_member_count >= 2 THEN
      RAISE EXCEPTION 'O plano Profissional permite no máximo 2 usuários administradores. Faça upgrade para o Plano Pro para ter usuários ilimitados.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Session Limit Function
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
  -- Get store plan
  SELECT plan INTO v_plan FROM public.stores WHERE id = p_store_id;

  -- Pro plan: unlimited sessions
  IF v_plan = 'pro' THEN
    RETURN true;
  END IF;

  -- Clean up stale sessions (inactive for > 1 hour) before counting
  DELETE FROM public.store_sessions
  WHERE store_id = p_store_id
    AND last_seen_at < now() - interval '1 hour';

  -- Also clean up the session being replaced if same token already exists
  DELETE FROM public.store_sessions
  WHERE session_token = p_session_token;

  -- Deduplicate: for each (store_id, user_id) pair, keep only the
  -- most recently seen row. This handles the JWT token rotation race
  -- where two rows were created for the same physical browser session.
  DELETE FROM public.store_sessions
  WHERE store_id = p_store_id
    AND id NOT IN (
      SELECT DISTINCT ON (store_id, user_id) id
      FROM public.store_sessions
      WHERE store_id = p_store_id
      ORDER BY store_id, user_id, last_seen_at DESC
    );

  -- Count active sessions for this store
  SELECT count(*) INTO v_session_count
  FROM public.store_sessions
  WHERE store_id = p_store_id;

  -- Enforce limits
  IF v_plan = 'basico' THEN
    -- Basico: max 1 concurrent session
    RETURN v_session_count < 1;
  ELSE
    -- Essencial: max 2 concurrent sessions
    RETURN v_session_count < 2;
  END IF;
END;
$$;

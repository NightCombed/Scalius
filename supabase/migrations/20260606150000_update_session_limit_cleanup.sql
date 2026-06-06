-- ─── Update Session Limit Cleanup ──────────────────────────────────────────────
-- Redefines check_session_limit to clean up sessions inactive for > 1 hour
-- instead of 30 days, preventing stale/orphaned sessions from blocking login.

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

  -- Count active sessions for this store
  SELECT count(*) INTO v_session_count
  FROM public.store_sessions
  WHERE store_id = p_store_id;

  -- Essencial: max 2 concurrent sessions
  RETURN v_session_count < 2;
END;
$$;

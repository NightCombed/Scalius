-- ─── Fix Duplicate Sessions ────────────────────────────────────────────────────
-- Cleans up phantom duplicate sessions that were created when Supabase's
-- automatic JWT token refresh triggered registerSession() instead of a migration.
--
-- For each (store_id, user_id) pair that has more than one row,
-- keep only the most recently active row and delete the rest.

DELETE FROM public.store_sessions
WHERE id NOT IN (
  SELECT DISTINCT ON (store_id, user_id) id
  FROM public.store_sessions
  ORDER BY store_id, user_id, last_seen_at DESC
);

-- ─── Update check_session_limit ────────────────────────────────────────────────
-- Adds deduplication: before counting active sessions, delete duplicate rows
-- for the same (store_id, user_id) pair keeping only the freshest one.
-- This prevents the limit from being triggered by phantom duplicate rows
-- caused by JWT token rotation.

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

  -- Essencial: max 2 concurrent sessions
  RETURN v_session_count < 2;
END;
$$;

-- ─── Store Sessions Table ────────────────────────────────────────────────────
-- Tracks active admin sessions per store to enforce concurrent device limits.
-- On Essencial plan: max 2 simultaneous sessions.
-- On Pro plan: unlimited sessions.

CREATE TABLE IF NOT EXISTS public.store_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,  -- hash of supabase JWT jti
  device_info   text,                  -- user-agent string (for display)
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_sessions_store_id
  ON public.store_sessions(store_id);

CREATE INDEX IF NOT EXISTS idx_store_sessions_user_id
  ON public.store_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_store_sessions_token
  ON public.store_sessions(session_token);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.store_sessions ENABLE ROW LEVEL SECURITY;

-- Store members can read sessions of their own store
CREATE POLICY "store_members_read_own_sessions"
  ON public.store_sessions FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own sessions
CREATE POLICY "users_insert_own_session"
  ON public.store_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions (last_seen_at heartbeat)
CREATE POLICY "users_update_own_session"
  ON public.store_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete sessions in stores they belong to (for remote logout by owner)
CREATE POLICY "store_members_delete_sessions"
  ON public.store_sessions FOR DELETE
  USING (
    store_id IN (
      SELECT store_id FROM public.store_members WHERE user_id = auth.uid()
    )
  );

-- ── Helper Functions ─────────────────────────────────────────────────────────

-- Cleans up stale sessions (>30 days inactive) and checks if a new one can be created.
-- Returns TRUE if allowed, FALSE if limit exceeded.
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

  -- Clean up stale sessions (inactive for >30 days) before counting
  DELETE FROM public.store_sessions
  WHERE store_id = p_store_id
    AND last_seen_at < now() - interval '30 days';

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

-- Revoke public access, grant to authenticated only
REVOKE ALL ON FUNCTION public.check_session_limit(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_session_limit(uuid, text) TO authenticated;

-- Grant DML privileges on the table itself (required for RLS policies to be evaluated)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_sessions TO authenticated, service_role;

COMMENT ON TABLE public.store_sessions IS
  'Tracks active admin sessions per store for concurrent device limit enforcement.';

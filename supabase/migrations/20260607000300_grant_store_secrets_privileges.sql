-- Migration: Grant table-level privileges on store_secrets to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_secrets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_secrets TO service_role;

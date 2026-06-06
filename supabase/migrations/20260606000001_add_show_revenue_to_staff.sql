-- Add show_revenue_to_staff column to store_settings.
-- When false, the revenue/financial KPIs on the Dashboard are hidden from staff members.
-- Default: true (staff can see revenue by default, owner/admin can disable).

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS show_revenue_to_staff boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.store_settings.show_revenue_to_staff IS
  'When false, revenue and financial KPIs on the Dashboard are hidden from staff (Colaborador) members. Only owner and admin can change this setting.';

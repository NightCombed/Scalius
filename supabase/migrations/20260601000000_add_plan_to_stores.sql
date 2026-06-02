-- Add plan column to stores table
-- Defines the subscription tier for each store.
-- 'essencial' = base plan (store-only emails, max 2 users, no ME label)
-- 'pro'       = full access (customer emails, unlimited users, ME 1-click label)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'essencial'
    CHECK (plan IN ('essencial', 'pro'));

-- Update RLS: super_admins can set plan on any store.
-- Store members can read their own store's plan via existing RLS policies.
-- No additional RLS needed — plan is readable by store members through stores table.

COMMENT ON COLUMN public.stores.plan IS 'Subscription plan for the store. Managed by platform super-admins only. Values: essencial | pro';

-- Trigger to enforce member limit (max 2 on 'essencial')
CREATE OR REPLACE FUNCTION public.check_store_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan text;
  v_member_count integer;
BEGIN
  -- Get the store plan
  SELECT plan INTO v_plan FROM public.stores WHERE id = NEW.store_id;
  
  -- If plan is essencial, check member count
  IF v_plan = 'essencial' THEN
    SELECT count(*) INTO v_member_count FROM public.store_members WHERE store_id = NEW.store_id;
    IF v_member_count >= 2 THEN
      RAISE EXCEPTION 'O plano Essencial permite no máximo 2 usuários administradores. Faça upgrade para o Plano Pro para ter usuários ilimitados.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_check_store_member_limit
BEFORE INSERT ON public.store_members
FOR EACH ROW
EXECUTE FUNCTION public.check_store_member_limit();


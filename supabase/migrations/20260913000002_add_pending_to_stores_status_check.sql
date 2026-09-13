-- Migration to update stores status check constraint to include 'pending'
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_status_check;
ALTER TABLE public.stores ADD CONSTRAINT stores_status_check CHECK (status IN ('active', 'trial', 'suspended', 'pending'));

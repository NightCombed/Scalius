-- Update status check constraint on stores table
-- Drop the old constraint that only allowed active/inactive
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_status_check;

-- Add new constraint allowing active, trial, and suspended
ALTER TABLE public.stores ADD CONSTRAINT stores_status_check CHECK (status IN ('active', 'trial', 'suspended'));

-- Set default status to trial (as it makes more sense for new signups)
ALTER TABLE public.stores ALTER COLUMN status SET DEFAULT 'trial';

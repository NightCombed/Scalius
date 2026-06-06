ALTER TABLE public.stores ADD COLUMN trial_started_at timestamptz DEFAULT now();

-- Set existing trial_started_at to created_at
UPDATE public.stores SET trial_started_at = created_at WHERE trial_started_at IS NULL;

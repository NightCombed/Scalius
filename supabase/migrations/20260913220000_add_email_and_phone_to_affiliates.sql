-- Add email and phone columns to public.affiliates table for direct access in super admin panel
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text;

-- Populate existing affiliates email from auth.users
UPDATE public.affiliates a
SET email = u.email
FROM auth.users u
WHERE a.user_id = u.id AND (a.email IS NULL OR a.email = '');

-- Index for searching affiliates by email
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates(email);

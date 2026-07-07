-- Migration: Create leads table for landing page capture
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  plan_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "leads: public insert" ON public.leads
  FOR INSERT TO public WITH CHECK (true);

-- Allow authenticated users (e.g. admins) to read leads
CREATE POLICY "leads: authenticated select" ON public.leads
  FOR SELECT TO authenticated USING (true);

-- Grant privileges
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT ON public.leads TO authenticated;

-- Allow super admins to delete leads
CREATE POLICY "leads: super admin delete" ON public.leads
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
    )
  );

GRANT DELETE ON public.leads TO authenticated;

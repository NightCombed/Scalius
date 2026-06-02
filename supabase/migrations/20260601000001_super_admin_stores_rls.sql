-- Allow super admins full access to stores
CREATE POLICY "Super admins can manage all stores"
ON public.stores
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  )
);

-- Allow super admins full access to store_members
CREATE POLICY "Super admins can manage all store_members"
ON public.store_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  )
);

-- Allow super admins full access to orders
CREATE POLICY "Super admins can manage all orders"
ON public.orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  )
);

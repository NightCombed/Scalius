-- Super admins can read all profiles (needed to look up users by email/name in super-admin panel)
CREATE POLICY IF NOT EXISTS "Super admins can read all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.id = auth.uid() AND p2.is_super_admin = true
  )
);

-- Super admins can update all profiles (e.g., set full_name when inviting a user)
CREATE POLICY IF NOT EXISTS "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.id = auth.uid() AND p2.is_super_admin = true
  )
);

-- Super admins can insert profiles (needed when Edge Function creates a new user)
CREATE POLICY IF NOT EXISTS "Super admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.id = auth.uid() AND p2.is_super_admin = true
  )
);

-- Super admins can manage store_settings for all stores
CREATE POLICY IF NOT EXISTS "Super admins can manage all store_settings"
ON public.store_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  )
);

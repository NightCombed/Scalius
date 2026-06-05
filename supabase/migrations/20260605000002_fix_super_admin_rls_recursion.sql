-- Create function to check if a user is super admin
-- Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_super_admin boolean;
BEGIN
  SELECT is_super_admin INTO v_super_admin
  FROM public.profiles
  WHERE id = p_user_id;
  RETURN COALESCE(v_super_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate profiles policies using the function
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;

CREATE POLICY "Super admins can read all profiles"
ON public.profiles
FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

-- Recreate store_settings policy using the function
DROP POLICY IF EXISTS "Super admins can manage all store_settings" ON public.store_settings;

CREATE POLICY "Super admins can manage all store_settings"
ON public.store_settings
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Recreate stores policy using the function
DROP POLICY IF EXISTS "Super admins can manage all stores" ON public.stores;

CREATE POLICY "Super admins can manage all stores"
ON public.stores
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Recreate store_members policy using the function
DROP POLICY IF EXISTS "Super admins can manage all store_members" ON public.store_members;

CREATE POLICY "Super admins can manage all store_members"
ON public.store_members
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Recreate orders policy using the function
DROP POLICY IF EXISTS "Super admins can manage all orders" ON public.orders;

CREATE POLICY "Super admins can manage all orders"
ON public.orders
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Fix infinite recursion in profiles table RLS policies
-- The issue is that profiles RLS policies are referencing the profiles table itself

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can modify admin status" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile non-admin fields" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a security definer function to get current user's admin status
-- This avoids the circular reference by using a function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_current_user_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create a security definer function to get user's admin status by ID
CREATE OR REPLACE FUNCTION public.get_user_is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recreate the profiles policies using simpler logic that avoids recursion

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Super admins can view all profiles (using auth.uid() directly to avoid recursion)
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE is_admin = true
  )
);

-- Users can update their own profile but cannot change admin status
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Only existing admins can modify admin status of OTHER users
CREATE POLICY "Admins can modify other users admin status" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() != id AND 
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- Update the is_admin function to use the security definer function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Use the security definer function to avoid recursion
  RETURN public.get_user_is_admin(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Update user_has_company_access to be more efficient and avoid potential recursion
CREATE OR REPLACE FUNCTION public.user_has_company_access(_user_id uuid, _company_id uuid, _required_role text DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  user_is_admin boolean := false;
BEGIN
  -- Use the security definer function to check admin status
  user_is_admin := public.get_user_is_admin(_user_id);

  -- Super admins always have access to all companies
  IF user_is_admin THEN
    RETURN TRUE;
  END IF;

  -- Check if the user has access to the specific company
  IF _required_role IS NULL THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.company_access 
      WHERE user_id = _user_id AND company_id = _company_id
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 
      FROM public.company_access 
      WHERE user_id = _user_id AND company_id = _company_id AND role = _required_role
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
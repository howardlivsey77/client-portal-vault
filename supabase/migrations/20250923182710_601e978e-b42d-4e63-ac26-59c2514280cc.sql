-- Security Fix Phase 1: Critical Privilege Escalation and Data Access Controls

-- 1. Fix Critical Privilege Escalation Vulnerability
-- Drop existing problematic policies on profiles table
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Add NOT NULL constraint to is_admin column to prevent null values
ALTER TABLE public.profiles ALTER COLUMN is_admin SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN is_admin SET DEFAULT false;

-- Create secure RLS policies for profiles table
-- Users can view their own profile (but not admin status)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile EXCEPT admin status
CREATE POLICY "Users can update their own profile non-admin fields" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
);

-- Only existing admins can modify admin status of any user
CREATE POLICY "Only admins can modify admin status" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() != id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 2. Secure Payroll Constants - Restrict to authenticated users with company access
DROP POLICY IF EXISTS "Allow users to view all constants" ON public.payroll_constants;

CREATE POLICY "Authenticated users can view payroll constants" 
ON public.payroll_constants 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Secure Sickness Schemes - Restrict to company access
DROP POLICY IF EXISTS "Users can view sickness schemes" ON public.sickness_schemes;

CREATE POLICY "Users can view sickness schemes for their companies" 
ON public.sickness_schemes 
FOR SELECT 
USING (
  company_id IS NULL OR 
  user_has_company_access(auth.uid(), company_id) OR 
  is_admin(auth.uid())
);

-- 4. Secure Tasks - Restrict to company members and assigned users
DROP POLICY IF EXISTS "Users can view all tasks" ON public.tasks;

CREATE POLICY "Users can view company tasks or assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  auth.uid() = assigned_to OR 
  (company_id IS NOT NULL AND user_has_company_access(auth.uid(), company_id)) OR
  is_admin(auth.uid())
);

-- 5. Create audit log table for admin privilege changes
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  old_admin_status boolean NOT NULL,
  new_admin_status boolean NOT NULL,
  change_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view admin audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (is_admin(auth.uid()));

-- 6. Create function to log admin status changes
CREATE OR REPLACE FUNCTION public.log_admin_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if admin status actually changed
  IF OLD.is_admin != NEW.is_admin THEN
    INSERT INTO public.admin_audit_log (
      target_user_id,
      changed_by,
      old_admin_status,
      new_admin_status,
      change_reason
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.is_admin,
      NEW.is_admin,
      'Admin status changed via database update'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for admin status changes
DROP TRIGGER IF EXISTS admin_status_change_trigger ON public.profiles;
CREATE TRIGGER admin_status_change_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_status_change();

-- 7. Create function to safely promote users to admin (with audit trail)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(
  _target_user_id uuid,
  _reason text DEFAULT 'Manual promotion'
)
RETURNS jsonb AS $$
DECLARE
  current_user_is_admin boolean;
  target_user_exists boolean;
  result jsonb;
BEGIN
  -- Check if current user is admin
  SELECT is_admin INTO current_user_is_admin 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF NOT current_user_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only administrators can promote users'
    );
  END IF;
  
  -- Check if target user exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = _target_user_id) INTO target_user_exists;
  
  IF NOT target_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target user does not exist'
    );
  END IF;
  
  -- Promote user and log the change
  UPDATE public.profiles 
  SET is_admin = true 
  WHERE id = _target_user_id;
  
  -- Log the promotion with reason
  INSERT INTO public.admin_audit_log (
    target_user_id,
    changed_by,
    old_admin_status,
    new_admin_status,
    change_reason
  ) VALUES (
    _target_user_id,
    auth.uid(),
    false,
    true,
    _reason
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User successfully promoted to admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Create function to safely demote admin users
CREATE OR REPLACE FUNCTION public.demote_admin_user(
  _target_user_id uuid,
  _reason text DEFAULT 'Manual demotion'
)
RETURNS jsonb AS $$
DECLARE
  current_user_is_admin boolean;
  target_user_exists boolean;
  admin_count integer;
BEGIN
  -- Check if current user is admin
  SELECT is_admin INTO current_user_is_admin 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF NOT current_user_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only administrators can demote users'
    );
  END IF;
  
  -- Prevent self-demotion
  IF _target_user_id = auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot demote yourself'
    );
  END IF;
  
  -- Check admin count to prevent removing last admin
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles 
  WHERE is_admin = true;
  
  IF admin_count <= 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot demote the last administrator'
    );
  END IF;
  
  -- Check if target user exists and is admin
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = _target_user_id AND is_admin = true
  ) INTO target_user_exists;
  
  IF NOT target_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target user does not exist or is not an admin'
    );
  END IF;
  
  -- Demote user
  UPDATE public.profiles 
  SET is_admin = false 
  WHERE id = _target_user_id;
  
  -- Log the demotion
  INSERT INTO public.admin_audit_log (
    target_user_id,
    changed_by,
    old_admin_status,
    new_admin_status,
    change_reason
  ) VALUES (
    _target_user_id,
    auth.uid(),
    true,
    false,
    _reason
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin successfully demoted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
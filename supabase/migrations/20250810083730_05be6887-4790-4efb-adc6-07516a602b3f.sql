-- Enable RLS on reference tables
ALTER TABLE public.nic_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_bands ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for nic_bands
CREATE POLICY "Authenticated users can view NIC bands" 
ON public.nic_bands 
FOR SELECT 
TO authenticated 
USING (true);

-- Add RLS policies for tax_bands  
CREATE POLICY "Authenticated users can view tax bands"
ON public.tax_bands
FOR SELECT
TO authenticated
USING (true);

-- Fix mutable search paths in database functions
CREATE OR REPLACE FUNCTION public.get_current_user_email()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT email FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_timesheet_entries_payroll_ids()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.timesheet_entries te
  SET payroll_id = e.payroll_id
  FROM public.employees e
  WHERE te.employee_id = e.id
  AND (te.payroll_id IS NULL OR te.payroll_id != e.payroll_id)
  AND e.payroll_id IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_companies(_user_id uuid)
 RETURNS TABLE(id uuid, name text, role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_is_admin boolean := false;
BEGIN
  -- Safely check if user is admin with enhanced error handling
  BEGIN
    SELECT COALESCE(p.is_admin, false) INTO user_is_admin
    FROM public.profiles p 
    WHERE p.id = _user_id;
    
    -- If no profile found, default to false
    IF NOT FOUND THEN
      user_is_admin := false;
    END IF;
  EXCEPTION 
    WHEN OTHERS THEN
      -- If any error occurs (table doesn't exist, permission issues, etc), assume not admin
      user_is_admin := false;
  END;
  
  -- If user is super admin, return all companies with 'admin' role
  IF user_is_admin THEN
    RETURN QUERY
    SELECT c.id, c.name, 'admin'::TEXT as role
    FROM public.companies c
    ORDER BY c.name;
  ELSE
    -- Otherwise return only companies the user has access to
    RETURN QUERY
    SELECT c.id, c.name, ca.role
    FROM public.companies c
    JOIN public.company_access ca ON c.id = ca.company_id
    WHERE ca.user_id = _user_id
    ORDER BY c.name;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  is_admin_user boolean := false;
BEGIN
  -- Safely check admin status with enhanced error handling
  BEGIN
    SELECT COALESCE(p.is_admin, false) INTO is_admin_user
    FROM public.profiles p
    WHERE p.id = user_id;
    
    -- If no profile found, default to false
    IF NOT FOUND THEN
      is_admin_user := false;
    END IF;
  EXCEPTION 
    WHEN OTHERS THEN
      -- If profiles table access fails or any other error, return false
      is_admin_user := false;
  END;
  
  RETURN is_admin_user;
END;
$function$;
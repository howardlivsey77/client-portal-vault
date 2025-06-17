
-- Update the get_user_companies function to be more resilient
CREATE OR REPLACE FUNCTION public.get_user_companies(_user_id uuid)
 RETURNS TABLE(id uuid, name text, role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Update the user_has_company_access function to be more resilient
CREATE OR REPLACE FUNCTION public.user_has_company_access(_user_id uuid, _company_id uuid, _required_role text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_is_admin boolean := false;
BEGIN
  -- Safely check if user is super admin with enhanced error handling
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
$function$;

-- Update the is_admin function to be more resilient
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

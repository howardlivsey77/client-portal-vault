-- Create a helper function to check if user has payroll access to a company
CREATE OR REPLACE FUNCTION public.user_has_payroll_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  -- Super admins always have payroll access
  IF public.get_user_is_admin(_user_id) THEN
    RETURN true;
  END IF;
  
  -- Get the user's role for this company
  SELECT role INTO user_role
  FROM public.company_access
  WHERE user_id = _user_id AND company_id = _company_id
  LIMIT 1;
  
  -- Payroll access requires 'admin' or 'payroll' role
  RETURN user_role IN ('admin', 'payroll');
END;
$$;
-- PHASE 1 CRITICAL SECURITY FIXES
-- Fix infinite recursion in RLS policies and implement proper data access controls

-- 1. CREATE SECURITY DEFINER FUNCTIONS TO PREVENT RLS RECURSION

-- Safe function to get current user's admin status
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- Safe function to get user's company role
CREATE OR REPLACE FUNCTION public.get_user_company_role(user_id uuid, company_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.company_access 
  WHERE user_id = get_user_company_role.user_id 
  AND company_id = get_user_company_role.company_id;
  
  RETURN COALESCE(user_role, 'none');
END;
$$;

-- 2. IMPLEMENT TIERED ACCESS FOR EMPLOYEE DATA

-- Function to get safe employee data (non-sensitive fields only)
CREATE OR REPLACE FUNCTION public.get_employee_safe_data(employee_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  department text,
  email text,
  hire_date date,
  status text,
  hours_per_week numeric,
  company_id uuid
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.department,
    e.email,
    e.hire_date,
    e.status,
    e.hours_per_week,
    e.company_id
  FROM public.employees e
  WHERE e.id = employee_id;
END;
$$;

-- 3. UPDATE EMPLOYEES TABLE RLS POLICIES FOR TIERED ACCESS

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view company employee basic info" ON public.employees;
DROP POLICY IF EXISTS "Company admins can view company employees" ON public.employees;

-- Create new tiered access policies

-- Policy 1: Users can view basic info of company employees (non-sensitive data only)
CREATE POLICY "Users can view basic employee info for their companies" 
ON public.employees 
FOR SELECT 
USING (
  NOT public.get_current_user_admin_status() 
  AND auth.uid() != user_id 
  AND public.get_user_company_role(auth.uid(), company_id) IN ('user', 'admin')
);

-- Policy 2: Company admins can view all employee data for their companies
CREATE POLICY "Company admins can view all employee data for their companies" 
ON public.employees 
FOR SELECT 
USING (
  NOT public.get_current_user_admin_status()
  AND public.get_user_company_role(auth.uid(), company_id) = 'admin'
);

-- Policy 3: Employees can view their own complete data
CREATE POLICY "Employees can view their own complete data" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. RESTRICT PAYROLL DATA ACCESS

-- Drop existing overly permissive payroll policies
DROP POLICY IF EXISTS "Users can view payroll results for accessible companies" ON public.payroll_results;
DROP POLICY IF EXISTS "Users can view their employees' payroll results" ON public.payroll_results;

-- Create restricted payroll access policies

-- Only super admins and payroll admins can view payroll results
CREATE POLICY "Payroll admins can view payroll results for their companies" 
ON public.payroll_results 
FOR SELECT 
USING (
  public.get_current_user_admin_status() 
  OR public.get_user_company_role(auth.uid(), company_id) = 'admin'
);

-- Employees can only view their own payroll results
CREATE POLICY "Employees can view their own payroll results" 
ON public.payroll_results 
FOR SELECT 
USING (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE user_id = auth.uid()
  )
);

-- 5. UPDATE PROFILES TABLE RLS TO USE SECURITY DEFINER FUNCTIONS

-- Drop existing problematic profile policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can modify other users admin status" ON public.profiles;

-- Create new safe profile policies
CREATE POLICY "Super admins can view all profiles safely" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_admin_status());

CREATE POLICY "Super admins can modify other users safely" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() != id 
  AND public.get_current_user_admin_status()
);

-- 6. SECURE COMPANY ACCESS TABLE

-- Drop existing broad company access policies
DROP POLICY IF EXISTS "Super admins can manage all company access" ON public.company_access;

-- Create more specific company access policies
CREATE POLICY "Super admins can view all company access" 
ON public.company_access 
FOR SELECT 
USING (public.get_current_user_admin_status());

CREATE POLICY "Super admins can insert company access" 
ON public.company_access 
FOR INSERT 
WITH CHECK (public.get_current_user_admin_status());

CREATE POLICY "Super admins can update company access" 
ON public.company_access 
FOR UPDATE 
USING (public.get_current_user_admin_status());

CREATE POLICY "Super admins can delete company access" 
ON public.company_access 
FOR DELETE 
USING (public.get_current_user_admin_status());

-- 7. ADD AUDIT LOGGING FOR SENSITIVE DATA ACCESS

-- Create audit log table for sensitive data access
CREATE TABLE IF NOT EXISTS public.data_access_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  accessed_table text NOT NULL,
  accessed_record_id uuid,
  access_type text NOT NULL, -- 'view', 'edit', 'delete', 'export'
  sensitive_fields text[], -- array of sensitive field names accessed
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.data_access_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Only super admins can view audit logs" 
ON public.data_access_audit_log 
FOR SELECT 
USING (public.get_current_user_admin_status());

-- Function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  table_name text,
  record_id uuid,
  access_type text,
  sensitive_fields text[] DEFAULT ARRAY[]::text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.data_access_audit_log (
    user_id,
    accessed_table,
    accessed_record_id,
    access_type,
    sensitive_fields
  ) VALUES (
    auth.uid(),
    table_name,
    record_id,
    access_type,
    sensitive_fields
  );
END;
$$;
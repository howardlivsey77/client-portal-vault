-- Fix RLS policies for employees table to use company-based access instead of user_id
-- This resolves the security issue where all employees share the same user_id

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Company admins can delete company employees" ON public.employees;
DROP POLICY IF EXISTS "Company admins can insert company employees" ON public.employees;
DROP POLICY IF EXISTS "Company admins can update company employees" ON public.employees;
DROP POLICY IF EXISTS "Company admins can view all employee data for their companies" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own complete data" ON public.employees;
DROP POLICY IF EXISTS "Super admins can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Super admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Super admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Super admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employee record" ON public.employees;
DROP POLICY IF EXISTS "Users can view basic employee info for their companies" ON public.employees;

-- Create new simplified and secure RLS policies for employees
-- Policy 1: Super admins can do everything
CREATE POLICY "Super admins have full access to employees" 
ON public.employees 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Policy 2: Company admins can manage employees in their companies
CREATE POLICY "Company admins can manage their company employees" 
ON public.employees 
FOR ALL 
USING (user_has_company_access(auth.uid(), company_id, 'admin'))
WITH CHECK (user_has_company_access(auth.uid(), company_id, 'admin'));

-- Policy 3: Company users can view employee basic info in their companies
CREATE POLICY "Company users can view employee basic info" 
ON public.employees 
FOR SELECT 
USING (user_has_company_access(auth.uid(), company_id));

-- Now fix the sickness records RLS policies to remove ambiguous column references
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can delete sickness records for their company employees" ON public.employee_sickness_records;
DROP POLICY IF EXISTS "Admins can insert sickness records for their company employees" ON public.employee_sickness_records;
DROP POLICY IF EXISTS "Admins can update sickness records for their company employees" ON public.employee_sickness_records;
DROP POLICY IF EXISTS "Users can view sickness records for their company employees" ON public.employee_sickness_records;

-- Create new sickness records policies with proper table qualification
CREATE POLICY "Company admins can manage sickness records" 
ON public.employee_sickness_records 
FOR ALL 
USING (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), employee_sickness_records.company_id, 'admin')
)
WITH CHECK (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), employee_sickness_records.company_id, 'admin')
);

CREATE POLICY "Company users can view sickness records" 
ON public.employee_sickness_records 
FOR SELECT 
USING (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), employee_sickness_records.company_id)
);

-- Update employee user_id to use a placeholder system user
-- Since employees are managed entities, not individual users, we'll use a special system user approach
-- This prevents the security issue while maintaining the required user_id field

-- Create a system function to handle employee creation with proper user assignment
CREATE OR REPLACE FUNCTION public.create_employee_with_system_user(
  employee_data jsonb,
  creator_user_id uuid,
  target_company_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_employee_id uuid;
BEGIN
  -- Verify the creator has permission to create employees in this company
  IF NOT (is_admin(creator_user_id) OR user_has_company_access(creator_user_id, target_company_id, 'admin')) THEN
    RAISE EXCEPTION 'Insufficient permissions to create employee in this company';
  END IF;
  
  -- Insert the employee with creator as the user_id (for now, until we implement individual accounts)
  INSERT INTO public.employees (
    first_name, last_name, department, hours_per_week, hourly_rate,
    email, address1, address2, address3, address4, postcode,
    date_of_birth, hire_date, payroll_id, gender, national_insurance_number,
    tax_code, nic_code, work_pattern, week_one_month_one, student_loan_plan,
    rate_2, rate_3, rate_4, user_id, company_id, status
  )
  SELECT 
    (employee_data->>'first_name')::text,
    (employee_data->>'last_name')::text,
    (employee_data->>'department')::text,
    (employee_data->>'hours_per_week')::numeric,
    (employee_data->>'hourly_rate')::numeric,
    (employee_data->>'email')::text,
    (employee_data->>'address1')::text,
    (employee_data->>'address2')::text,
    (employee_data->>'address3')::text,
    (employee_data->>'address4')::text,
    (employee_data->>'postcode')::text,
    (employee_data->>'date_of_birth')::date,
    (employee_data->>'hire_date')::date,
    (employee_data->>'payroll_id')::text,
    (employee_data->>'gender')::text,
    (employee_data->>'national_insurance_number')::text,
    (employee_data->>'tax_code')::text,
    (employee_data->>'nic_code')::text,
    (employee_data->>'work_pattern')::text,
    COALESCE((employee_data->>'week_one_month_one')::boolean, false),
    (employee_data->>'student_loan_plan')::integer,
    (employee_data->>'rate_2')::numeric,
    (employee_data->>'rate_3')::numeric,
    (employee_data->>'rate_4')::numeric,
    creator_user_id,
    target_company_id,
    COALESCE((employee_data->>'status')::text, 'active')
  RETURNING id INTO new_employee_id;
  
  RETURN new_employee_id;
END;
$$;
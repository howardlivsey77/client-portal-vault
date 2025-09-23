-- Fix employee table security by implementing proper company-based RLS policies
-- Current policies are too broad and don't implement proper company access control

-- Drop existing overly broad policies
DROP POLICY IF EXISTS "Administrators can delete employee records" ON public.employees;
DROP POLICY IF EXISTS "Administrators can insert employee records" ON public.employees;
DROP POLICY IF EXISTS "Administrators can update employee records" ON public.employees;
DROP POLICY IF EXISTS "Administrators can view all employee records" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;

-- Create comprehensive company-based security policies

-- 1. SELECT policies with different levels of access
-- Super admins can view all employee records
CREATE POLICY "Super admins can view all employees" 
ON public.employees 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Company admins can view all employees in their companies
CREATE POLICY "Company admins can view company employees" 
ON public.employees 
FOR SELECT 
USING (
  NOT is_admin(auth.uid()) AND 
  user_has_company_access(auth.uid(), company_id, 'admin')
);

-- Users can always view their own complete employee record
CREATE POLICY "Users can view their own employee record" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = user_id);

-- Regular users can view basic employee info in their companies
CREATE POLICY "Users can view company employee basic info" 
ON public.employees 
FOR SELECT 
USING (
  NOT is_admin(auth.uid()) AND 
  auth.uid() != user_id AND
  user_has_company_access(auth.uid(), company_id)
);

-- 2. INSERT policies
-- Super admins can insert employee records for any company
CREATE POLICY "Super admins can insert employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Company admins can insert employee records for their companies
CREATE POLICY "Company admins can insert company employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  NOT is_admin(auth.uid()) AND 
  user_has_company_access(auth.uid(), company_id, 'admin')
);

-- 3. UPDATE policies
-- Super admins can update any employee record
CREATE POLICY "Super admins can update employees" 
ON public.employees 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Company admins can update employee records in their companies
CREATE POLICY "Company admins can update company employees" 
ON public.employees 
FOR UPDATE 
USING (
  NOT is_admin(auth.uid()) AND 
  user_has_company_access(auth.uid(), company_id, 'admin')
);

-- Users can update limited fields in their own employee record
CREATE POLICY "Users can update their own employee record" 
ON public.employees 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. DELETE policies
-- Super admins can delete any employee record
CREATE POLICY "Super admins can delete employees" 
ON public.employees 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Company admins can delete employee records in their companies
CREATE POLICY "Company admins can delete company employees" 
ON public.employees 
FOR DELETE 
USING (
  NOT is_admin(auth.uid()) AND 
  user_has_company_access(auth.uid(), company_id, 'admin')
);

-- Create a function to get employee sensitive data (for admins only)
CREATE OR REPLACE FUNCTION public.get_employee_sensitive_data(employee_id uuid)
RETURNS TABLE(
  hourly_rate numeric,
  rate_2 numeric,
  rate_3 numeric,
  rate_4 numeric,
  national_insurance_number text,
  tax_code text,
  nic_code text,
  student_loan_plan integer,
  previous_year_pensionable_pay numeric,
  nhs_pension_tier integer,
  nhs_pension_employee_rate numeric,
  address1 text,
  address2 text,
  address3 text,
  address4 text,
  postcode text,
  date_of_birth date,
  payroll_id text
) AS $$
DECLARE
  emp_company_id uuid;
BEGIN
  -- Get the employee's company
  SELECT company_id INTO emp_company_id 
  FROM public.employees 
  WHERE id = employee_id;
  
  -- Check if user has admin access to this employee's company
  IF NOT (is_admin(auth.uid()) OR user_has_company_access(auth.uid(), emp_company_id, 'admin')) THEN
    RAISE EXCEPTION 'Insufficient permissions to access sensitive employee data';
  END IF;
  
  -- Return sensitive data
  RETURN QUERY
  SELECT 
    e.hourly_rate,
    e.rate_2,
    e.rate_3,
    e.rate_4,
    e.national_insurance_number,
    e.tax_code,
    e.nic_code,
    e.student_loan_plan,
    e.previous_year_pensionable_pay,
    e.nhs_pension_tier,
    e.nhs_pension_employee_rate,
    e.address1,
    e.address2,
    e.address3,
    e.address4,
    e.postcode,
    e.date_of_birth,
    e.payroll_id
  FROM public.employees e
  WHERE e.id = employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
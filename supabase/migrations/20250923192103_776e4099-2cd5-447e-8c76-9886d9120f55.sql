-- Fix payroll_results table security by restricting access to payroll administrators only

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can delete payroll results for accessible companies" ON public.payroll_results;
DROP POLICY IF EXISTS "Users can insert payroll results for accessible companies" ON public.payroll_results;
DROP POLICY IF EXISTS "Users can update payroll results for accessible companies" ON public.payroll_results;
DROP POLICY IF EXISTS "Users can delete payroll results for their employees" ON public.payroll_results;
DROP POLICY IF EXISTS "Users can insert payroll results for their employees" ON public.payroll_results;
DROP POLICY IF EXISTS "Users can update payroll results for their employees" ON public.payroll_results;

-- Create stricter policies for payroll administrators only
CREATE POLICY "Only payroll admins can insert payroll results"
ON public.payroll_results
FOR INSERT
WITH CHECK (
  get_current_user_admin_status() OR 
  (get_user_company_role(auth.uid(), company_id) = 'admin'::text)
);

CREATE POLICY "Only payroll admins can update payroll results"
ON public.payroll_results
FOR UPDATE
USING (
  get_current_user_admin_status() OR 
  (get_user_company_role(auth.uid(), company_id) = 'admin'::text)
);

CREATE POLICY "Only payroll admins can delete payroll results"
ON public.payroll_results
FOR DELETE
USING (
  get_current_user_admin_status() OR 
  (get_user_company_role(auth.uid(), company_id) = 'admin'::text)
);

-- Update the existing SELECT policy to be more restrictive
DROP POLICY IF EXISTS "Payroll admins can view payroll results for their companies" ON public.payroll_results;

CREATE POLICY "Strict payroll results access control"
ON public.payroll_results
FOR SELECT
USING (
  -- Super admins can see all
  get_current_user_admin_status() OR
  -- Company admins can see their company's payroll results
  (get_user_company_role(auth.uid(), company_id) = 'admin'::text) OR
  -- Employees can only see their own results
  (employee_id IN (
    SELECT employees.id
    FROM employees
    WHERE employees.user_id = auth.uid()
  ))
);
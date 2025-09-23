-- Fix the ambiguous column reference in the RLS policy for employee_sickness_records
-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Admins can insert sickness records for their company employees" ON public.employee_sickness_records;

-- Create the corrected INSERT policy with proper table qualification
CREATE POLICY "Admins can insert sickness records for their company employees" 
ON public.employee_sickness_records 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.id = employee_sickness_records.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id, 'admin'::text)
  )
);

-- Also check and fix the UPDATE policy to ensure no ambiguity
DROP POLICY IF EXISTS "Admins can update sickness records for their company employees" ON public.employee_sickness_records;

CREATE POLICY "Admins can update sickness records for their company employees" 
ON public.employee_sickness_records 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.id = employee_sickness_records.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id, 'admin'::text)
  )
);
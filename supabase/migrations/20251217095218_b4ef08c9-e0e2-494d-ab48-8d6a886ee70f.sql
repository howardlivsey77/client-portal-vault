-- Update RLS policies to allow payroll users to manage sickness records

-- 1. employee_sickness_records - Drop and recreate management policy
DROP POLICY IF EXISTS "Company admins can manage sickness records" ON employee_sickness_records;

CREATE POLICY "Company admins and payroll can manage sickness records"
ON employee_sickness_records
FOR ALL
USING (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), company_id, 'admin'::text) OR
  user_has_company_access(auth.uid(), company_id, 'payroll'::text)
)
WITH CHECK (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), company_id, 'admin'::text) OR
  user_has_company_access(auth.uid(), company_id, 'payroll'::text)
);

-- 2. employee_sickness_entitlement_usage - Drop and recreate management policy
DROP POLICY IF EXISTS "Admins can manage entitlement usage for their company employees" 
ON employee_sickness_entitlement_usage;

CREATE POLICY "Admins and payroll can manage entitlement usage"
ON employee_sickness_entitlement_usage
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_sickness_entitlement_usage.employee_id 
    AND (
      user_has_company_access(auth.uid(), e.company_id, 'admin'::text) OR
      user_has_company_access(auth.uid(), e.company_id, 'payroll'::text)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_sickness_entitlement_usage.employee_id 
    AND (
      user_has_company_access(auth.uid(), e.company_id, 'admin'::text) OR
      user_has_company_access(auth.uid(), e.company_id, 'payroll'::text)
    )
  )
);

-- 3. employee_sickness_historical_balances - Drop and recreate management policy
DROP POLICY IF EXISTS "Admins can manage historical balances for their company employe"
ON employee_sickness_historical_balances;

CREATE POLICY "Admins and payroll can manage historical balances"
ON employee_sickness_historical_balances
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_sickness_historical_balances.employee_id 
    AND (
      user_has_company_access(auth.uid(), e.company_id, 'admin'::text) OR
      user_has_company_access(auth.uid(), e.company_id, 'payroll'::text)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.id = employee_sickness_historical_balances.employee_id 
    AND (
      user_has_company_access(auth.uid(), e.company_id, 'admin'::text) OR
      user_has_company_access(auth.uid(), e.company_id, 'payroll'::text)
    )
  )
);
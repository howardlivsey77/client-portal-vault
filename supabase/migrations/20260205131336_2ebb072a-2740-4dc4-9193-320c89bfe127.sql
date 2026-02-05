-- Drop existing policies
DROP POLICY IF EXISTS "Company admins can manage payroll periods" ON public.payroll_periods;
DROP POLICY IF EXISTS "Company admins can manage payroll details" ON public.payroll_employee_details;

-- Create updated policy for payroll_periods
CREATE POLICY "Company admins and payroll can manage payroll periods"
ON public.payroll_periods
FOR ALL
TO authenticated
USING (
  user_has_company_access(auth.uid(), company_id, 'admin'::text) OR
  user_has_company_access(auth.uid(), company_id, 'payroll'::text) OR
  is_admin(auth.uid())
)
WITH CHECK (
  user_has_company_access(auth.uid(), company_id, 'admin'::text) OR
  user_has_company_access(auth.uid(), company_id, 'payroll'::text) OR
  is_admin(auth.uid())
);

-- Create updated policy for payroll_employee_details
CREATE POLICY "Company admins and payroll can manage payroll details"
ON public.payroll_employee_details
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.payroll_periods pp
    WHERE pp.id = payroll_employee_details.payroll_period_id
    AND (
      user_has_company_access(auth.uid(), pp.company_id, 'admin'::text) OR
      user_has_company_access(auth.uid(), pp.company_id, 'payroll'::text)
    )
  )
  OR is_admin(auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.payroll_periods pp
    WHERE pp.id = payroll_employee_details.payroll_period_id
    AND (
      user_has_company_access(auth.uid(), pp.company_id, 'admin'::text) OR
      user_has_company_access(auth.uid(), pp.company_id, 'payroll'::text)
    )
  )
  OR is_admin(auth.uid())
);
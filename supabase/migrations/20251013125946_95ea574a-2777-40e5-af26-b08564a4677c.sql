-- Enable regular users to access Tasks, Timesheets, and Payroll data for their companies

-- 1. Add RLS policies for Tasks table
CREATE POLICY "Users can view tasks for their companies"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_access ca
    WHERE ca.user_id = auth.uid() 
    AND ca.company_id = tasks.company_id
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Users can create tasks for their companies"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_access ca
    WHERE ca.user_id = auth.uid() 
    AND ca.company_id = tasks.company_id
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Users can update tasks for their companies"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_access ca
    WHERE ca.user_id = auth.uid() 
    AND ca.company_id = tasks.company_id
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Users can delete tasks for their companies"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_access ca
    WHERE ca.user_id = auth.uid() 
    AND ca.company_id = tasks.company_id
  )
  OR is_admin(auth.uid())
);

-- 2. Add RLS policies for Timesheet Entries
CREATE POLICY "Users can view timesheet entries for their companies"
ON public.timesheet_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    JOIN public.company_access ca ON ca.company_id = e.company_id
    WHERE e.id = timesheet_entries.employee_id
    AND ca.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Company admins can manage timesheet entries"
ON public.timesheet_entries
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = timesheet_entries.employee_id
    AND user_has_company_access(auth.uid(), e.company_id, 'admin')
  )
  OR is_admin(auth.uid())
);

-- 3. Update Payroll Periods RLS Policies
DROP POLICY IF EXISTS "Users can view their own payroll periods" ON public.payroll_periods;
DROP POLICY IF EXISTS "Users can insert their own payroll periods" ON public.payroll_periods;

CREATE POLICY "Users can view payroll periods for their companies"
ON public.payroll_periods
FOR SELECT
TO authenticated
USING (
  user_has_company_access(auth.uid(), company_id)
  OR is_admin(auth.uid())
);

CREATE POLICY "Company admins can manage payroll periods"
ON public.payroll_periods
FOR ALL
TO authenticated
USING (
  user_has_company_access(auth.uid(), company_id, 'admin')
  OR is_admin(auth.uid())
)
WITH CHECK (
  user_has_company_access(auth.uid(), company_id, 'admin')
  OR is_admin(auth.uid())
);

-- 4. Update Payroll Employee Details RLS Policies
DROP POLICY IF EXISTS "Users can view their own payroll employee details" ON public.payroll_employee_details;
DROP POLICY IF EXISTS "Users can insert their own payroll employee details" ON public.payroll_employee_details;

CREATE POLICY "Users can view payroll details for their companies"
ON public.payroll_employee_details
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.payroll_periods pp
    WHERE pp.id = payroll_employee_details.payroll_period_id
    AND user_has_company_access(auth.uid(), pp.company_id)
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Company admins can manage payroll details"
ON public.payroll_employee_details
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.payroll_periods pp
    WHERE pp.id = payroll_employee_details.payroll_period_id
    AND user_has_company_access(auth.uid(), pp.company_id, 'admin')
  )
  OR is_admin(auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.payroll_periods pp
    WHERE pp.id = payroll_employee_details.payroll_period_id
    AND user_has_company_access(auth.uid(), pp.company_id, 'admin')
  )
  OR is_admin(auth.uid())
);
-- Allow all company users to view employees in their company
CREATE POLICY "Company users can view their company employees"
ON public.employees
FOR SELECT
USING (user_has_company_access(auth.uid(), company_id));
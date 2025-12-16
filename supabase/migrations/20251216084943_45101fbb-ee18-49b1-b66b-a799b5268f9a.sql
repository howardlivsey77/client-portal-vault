-- Allow all company users to create employees in their company
CREATE POLICY "Company users can create employees in their company"
ON public.employees
FOR INSERT
WITH CHECK (user_has_company_access(auth.uid(), company_id));
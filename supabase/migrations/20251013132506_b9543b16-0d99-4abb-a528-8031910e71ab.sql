-- Allow employees to view their own record
CREATE POLICY "Employees can view their own record"
ON public.employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow employees to update their own contact information
CREATE POLICY "Employees can update their own contact info"
ON public.employees
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
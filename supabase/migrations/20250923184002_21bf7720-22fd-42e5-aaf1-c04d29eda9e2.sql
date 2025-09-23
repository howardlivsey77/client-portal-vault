-- Continue dropping remaining policies
DROP POLICY IF EXISTS "Administrators can view all employee records" ON public.employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON public.employees;
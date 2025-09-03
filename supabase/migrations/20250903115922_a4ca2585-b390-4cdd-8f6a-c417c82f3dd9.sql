-- Lock down work_patterns SELECT access
-- 1) Remove overly permissive policy
DROP POLICY IF EXISTS "Allow select access for all users" ON public.work_patterns;

-- 2) Allow employees to view their own work patterns
CREATE POLICY "Users can view their own work patterns"
ON public.work_patterns
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = work_patterns.employee_id
      AND e.user_id = auth.uid()
  )
);

-- 3) Allow users to view work patterns for companies they have access to
CREATE POLICY "Users can view work patterns for accessible companies"
ON public.work_patterns
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = work_patterns.employee_id
      AND public.user_has_company_access(auth.uid(), e.company_id)
  )
);

-- Drop the existing problematic policy that uses direct subquery on company_access
DROP POLICY IF EXISTS "Users can view company departments" ON public.departments;

-- Create new policy using the SECURITY DEFINER function (bypasses RLS on company_access)
CREATE POLICY "Users can view company departments"
ON public.departments
FOR SELECT
USING (
  user_has_company_access(auth.uid(), company_id)
  OR is_admin(auth.uid())
);
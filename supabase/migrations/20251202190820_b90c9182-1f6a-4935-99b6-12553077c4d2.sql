-- Fix employees table security: Remove overly permissive SELECT policy
-- that allows ANY company user to view ALL employee data including sensitive fields

-- Drop the overly permissive policy that allows any company user to see all employee data
DROP POLICY IF EXISTS "Company users can view employee basic info" ON public.employees;

-- The remaining policies provide proper access control:
-- 1. "Super admins have full access to employees" - for super admins
-- 2. "Company admins can manage their company employees" - for company admins
-- 3. "Employees can view their own record" - for individual employees
-- 4. "Employees can update their own contact info" - for individual employees

-- Verify: After this migration:
-- - Super admins can see all employees (via is_admin check)
-- - Company admins can see employees in their company (via user_has_company_access with 'admin' role)
-- - Employees can see only their own record (via user_id = auth.uid())
-- - Regular company users (non-admins) can NOT see other employees' sensitive data
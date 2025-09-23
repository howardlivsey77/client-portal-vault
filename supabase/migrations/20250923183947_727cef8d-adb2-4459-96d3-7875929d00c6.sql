-- Fix employee table security with careful lock management
-- Break this into smaller operations to avoid deadlocks

-- First, just drop the existing policies one by one
DROP POLICY IF EXISTS "Administrators can delete employee records" ON public.employees;
DROP POLICY IF EXISTS "Administrators can insert employee records" ON public.employees;
DROP POLICY IF EXISTS "Administrators can update employee records" ON public.employees;
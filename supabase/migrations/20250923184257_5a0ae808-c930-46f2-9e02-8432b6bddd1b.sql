-- Fix critical security vulnerability in timesheet_entries table
-- Replace overly permissive SELECT policy with proper company-based access control

-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read timesheet entries" ON public.timesheet_entries;

-- Create new secure SELECT policy that restricts access based on company access
CREATE POLICY "Users can view timesheet entries for accessible companies" 
ON public.timesheet_entries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.employees e 
    WHERE e.id = timesheet_entries.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id)
  )
);

-- Also update the ALL policy to be more specific for better security
DROP POLICY IF EXISTS "Users can insert/update timesheet entries" ON public.timesheet_entries;

-- Create separate policies for INSERT and UPDATE for better granular control
CREATE POLICY "Users can insert timesheet entries for accessible employees" 
ON public.timesheet_entries 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.employees e 
    WHERE e.id = timesheet_entries.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id)
  )
);

CREATE POLICY "Users can update timesheet entries for accessible employees" 
ON public.timesheet_entries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.employees e 
    WHERE e.id = timesheet_entries.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id)
  )
);

CREATE POLICY "Users can delete timesheet entries for accessible employees" 
ON public.timesheet_entries 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.employees e 
    WHERE e.id = timesheet_entries.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id)
  )
);
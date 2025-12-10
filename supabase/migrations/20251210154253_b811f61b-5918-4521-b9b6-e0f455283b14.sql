-- Drop the existing global unique constraint on payroll_id
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS unique_payroll_id;

-- Create a new compound unique index (company_id + payroll_id)
-- This allows the same payroll_id to exist in different companies
CREATE UNIQUE INDEX unique_payroll_id_per_company 
ON public.employees (company_id, payroll_id) 
WHERE payroll_id IS NOT NULL;
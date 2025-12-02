-- Add monthly_salary column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS monthly_salary numeric NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.employees.monthly_salary IS 'Monthly salary amount in GBP for salaried employees';
-- Add cost_centre column to employees table
ALTER TABLE public.employees 
ADD COLUMN cost_centre TEXT;

-- Add index for cost_centre filtering
CREATE INDEX idx_employees_cost_centre ON public.employees(company_id, cost_centre);

-- Add comment for documentation
COMMENT ON COLUMN public.employees.cost_centre IS 'Optional cost centre assignment for the employee';
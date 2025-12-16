-- Add P45/P46 related columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS has_p45 boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS taxable_pay_ytd numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tax_paid_ytd numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS p46_statement text DEFAULT NULL;

-- Add constraint for p46_statement values
ALTER TABLE public.employees 
ADD CONSTRAINT check_p46_statement 
CHECK (p46_statement IS NULL OR p46_statement IN ('A', 'B', 'C'));
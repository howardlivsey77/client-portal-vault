
-- Add tax year and period fields to payroll_results table
ALTER TABLE public.payroll_results
ADD COLUMN IF NOT EXISTS tax_year TEXT,
ADD COLUMN IF NOT EXISTS tax_period INTEGER,
ADD COLUMN IF NOT EXISTS taxable_pay_ytd INTEGER,
ADD COLUMN IF NOT EXISTS income_tax_ytd INTEGER,
ADD COLUMN IF NOT EXISTS nic_employee_ytd INTEGER,
ADD COLUMN IF NOT EXISTS gross_pay_ytd INTEGER;

-- Add comment to explain tax_year format
COMMENT ON COLUMN public.payroll_results.tax_year IS 'UK Tax Year in YYYY-YYYY format (e.g., 2025-2026)';

-- Add comment to explain tax_period
COMMENT ON COLUMN public.payroll_results.tax_period IS 'Tax Period 1-12 (1=April, 12=March)';

-- Add emergency tax code indicator
ALTER TABLE public.payroll_results
ADD COLUMN IF NOT EXISTS is_emergency_tax BOOLEAN DEFAULT FALSE;

-- Index for faster querying by tax year
CREATE INDEX IF NOT EXISTS idx_payroll_results_tax_year ON public.payroll_results(tax_year);

-- Index for faster querying by employee and tax year together
CREATE INDEX IF NOT EXISTS idx_payroll_results_employee_tax_year 
ON public.payroll_results(employee_id, tax_year);

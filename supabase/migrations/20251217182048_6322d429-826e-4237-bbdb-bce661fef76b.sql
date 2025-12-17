-- Add missing YTD tracking columns (signed integers for refunds)
ALTER TABLE payroll_results 
  ADD COLUMN IF NOT EXISTS nic_employer_ytd integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS student_loan_ytd integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employee_pension_ytd integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employer_pension_ytd integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_pay_ytd integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_pay_ytd integer DEFAULT 0;

-- Add period date tracking for auditing and reconciliation
ALTER TABLE payroll_results
  ADD COLUMN IF NOT EXISTS period_start_date date,
  ADD COLUMN IF NOT EXISTS period_end_date date,
  ADD COLUMN IF NOT EXISTS payment_date date;

-- Add unique constraint to prevent duplicate period entries
ALTER TABLE payroll_results
  DROP CONSTRAINT IF EXISTS payroll_results_unique_period;

ALTER TABLE payroll_results
  ADD CONSTRAINT payroll_results_unique_period 
  UNIQUE (company_id, employee_id, tax_year, tax_period);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_payroll_results_employee_period 
  ON payroll_results (company_id, employee_id, tax_year, tax_period);

-- CRITICAL: Document YTD derivation rule - these must be cumulative from prior period
COMMENT ON COLUMN payroll_results.income_tax_ytd 
IS 'Derived cumulatively from prior period YTD + unrounded calculation. Do NOT recompute from period rows.';

COMMENT ON COLUMN payroll_results.gross_pay_ytd 
IS 'Derived cumulatively from prior period YTD + unrounded gross pay. Do NOT recompute from period rows.';

COMMENT ON COLUMN payroll_results.nic_employee_ytd 
IS 'Derived cumulatively from prior period YTD + unrounded NI. Do NOT recompute from period rows.';

COMMENT ON COLUMN payroll_results.nic_employer_ytd 
IS 'Derived cumulatively from prior period YTD + unrounded employer NI. Do NOT recompute from period rows.';

COMMENT ON COLUMN payroll_results.student_loan_ytd 
IS 'Derived cumulatively from prior period YTD + unrounded student loan. Do NOT recompute from period rows.';

COMMENT ON COLUMN payroll_results.net_pay_ytd 
IS 'Derived cumulatively from prior period YTD + unrounded net pay. Do NOT recompute from period rows.';

-- Create YTD summary view for quick reporting
-- IMPORTANT: Uses MAX(YTD), not SUM(period), to avoid rounding drift
CREATE OR REPLACE VIEW payroll_ytd_summary AS
SELECT 
  company_id,
  employee_id,
  tax_year,
  MAX(tax_period) as last_period,
  MAX(gross_pay_ytd) as gross_pay_ytd,
  MAX(taxable_pay_ytd) as taxable_pay_ytd,
  MAX(income_tax_ytd) as income_tax_ytd,
  MAX(nic_employee_ytd) as nic_employee_ytd,
  MAX(nic_employer_ytd) as nic_employer_ytd,
  MAX(student_loan_ytd) as student_loan_ytd,
  MAX(employee_pension_ytd) as employee_pension_ytd,
  MAX(employer_pension_ytd) as employer_pension_ytd,
  MAX(nhs_pension_employee_ytd) as nhs_pension_employee_ytd,
  MAX(nhs_pension_employer_ytd) as nhs_pension_employer_ytd,
  MAX(free_pay_ytd) as free_pay_ytd,
  MAX(net_pay_ytd) as net_pay_ytd
FROM payroll_results
WHERE company_id IS NOT NULL
GROUP BY company_id, employee_id, tax_year;
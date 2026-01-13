-- Add payroll period targeting columns to employee_sickness_records
-- This allows sickness records to be associated with specific payroll periods
-- for SSP calculation purposes

ALTER TABLE employee_sickness_records
ADD COLUMN payroll_period_number integer,
ADD COLUMN payroll_financial_year integer;

-- Add index for efficient filtering by payroll period
CREATE INDEX idx_sickness_records_payroll_period 
ON employee_sickness_records(payroll_period_number, payroll_financial_year)
WHERE payroll_period_number IS NOT NULL;
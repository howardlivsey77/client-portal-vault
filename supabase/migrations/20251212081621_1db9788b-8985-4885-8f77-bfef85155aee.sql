-- Add payroll migration start point columns to companies table
ALTER TABLE companies
ADD COLUMN payroll_start_year integer,
ADD COLUMN payroll_start_period integer CHECK (payroll_start_period >= 1 AND payroll_start_period <= 12);

COMMENT ON COLUMN companies.payroll_start_year IS 'The tax year (e.g. 2024 for 2024/25) when the company migrated to this payroll system';
COMMENT ON COLUMN companies.payroll_start_period IS 'The tax period (1-12, April=1) when the company started using this payroll system';
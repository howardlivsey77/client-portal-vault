-- Fix payroll_results dates for Period 1 (April 2026)
-- Period 1 should be April: 2026-04-01 to 2026-04-30
UPDATE payroll_results
SET 
  payroll_period = '2026-04-30',
  period_start_date = '2026-04-01',
  period_end_date = '2026-04-30',
  payment_date = '2026-04-30'
WHERE tax_period = 1 
  AND tax_year = '2026/27'
  AND company_id = '5d0ec673-e6a0-4be4-b0a5-f006f5723611';

-- Fix payroll_periods dates for Period 1
UPDATE payroll_periods
SET 
  date_from = '2026-04-01',
  date_to = '2026-04-30'
WHERE period_number = 1 
  AND financial_year = 2026
  AND company_id = '5d0ec673-e6a0-4be4-b0a5-f006f5723611';
-- Fix security definer issue on the view by explicitly setting SECURITY INVOKER
DROP VIEW IF EXISTS payroll_ytd_summary;

-- Recreate the YTD summary view with explicit SECURITY INVOKER
-- IMPORTANT: Uses MAX(YTD), not SUM(period), to avoid rounding drift
CREATE VIEW payroll_ytd_summary 
WITH (security_invoker = true) 
AS
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
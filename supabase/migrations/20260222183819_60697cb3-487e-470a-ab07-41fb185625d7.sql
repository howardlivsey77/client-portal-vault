
ALTER TABLE public.payroll_results
  ADD COLUMN IF NOT EXISTS gross_earnings_for_nics_ytd numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_at_lel_ytd          numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_lel_to_pt_ytd       numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_pt_to_uel_ytd        numeric DEFAULT 0;

COMMENT ON COLUMN public.payroll_results.gross_earnings_for_nics_ytd IS
  'FPS GrossEarningsForNICsYTD — total NI-able gross earnings this tax year. Cumulative YTD, not sum of period rows.';

COMMENT ON COLUMN public.payroll_results.earnings_at_lel_ytd IS
  'FPS AtLELYTD — earnings at the Lower Earnings Limit band YTD. Cumulative.';

COMMENT ON COLUMN public.payroll_results.earnings_lel_to_pt_ytd IS
  'FPS LELtoPTYTD — earnings between LEL and Primary Threshold YTD. Cumulative.';

COMMENT ON COLUMN public.payroll_results.earnings_pt_to_uel_ytd IS
  'FPS PTtoUELYTD — earnings between Primary Threshold and Upper Earnings Limit YTD. Cumulative.';

DROP VIEW IF EXISTS payroll_ytd_summary;

CREATE VIEW payroll_ytd_summary
WITH (security_invoker = true)
AS
SELECT
  company_id,
  employee_id,
  tax_year,
  MAX(tax_period)                    AS last_period,
  MAX(gross_pay_ytd)                 AS gross_pay_ytd,
  MAX(taxable_pay_ytd)               AS taxable_pay_ytd,
  MAX(income_tax_ytd)                AS income_tax_ytd,
  MAX(nic_employee_ytd)              AS nic_employee_ytd,
  MAX(nic_employer_ytd)              AS nic_employer_ytd,
  MAX(gross_earnings_for_nics_ytd)   AS gross_earnings_for_nics_ytd,
  MAX(earnings_at_lel_ytd)           AS earnings_at_lel_ytd,
  MAX(earnings_lel_to_pt_ytd)        AS earnings_lel_to_pt_ytd,
  MAX(earnings_pt_to_uel_ytd)        AS earnings_pt_to_uel_ytd,
  MAX(student_loan_ytd)              AS student_loan_ytd,
  MAX(employee_pension_ytd)          AS employee_pension_ytd,
  MAX(employer_pension_ytd)          AS employer_pension_ytd,
  MAX(nhs_pension_employee_ytd)      AS nhs_pension_employee_ytd,
  MAX(nhs_pension_employer_ytd)      AS nhs_pension_employer_ytd,
  MAX(free_pay_ytd)                  AS free_pay_ytd,
  MAX(net_pay_ytd)                   AS net_pay_ytd
FROM payroll_results
WHERE company_id IS NOT NULL
GROUP BY company_id, employee_id, tax_year;

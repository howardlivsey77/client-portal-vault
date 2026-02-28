/**
 * Supabase data fetcher for FPS generation.
 * Uses service role key for full access to payroll data.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EmployeeRow, PayrollResultRow } from './types.ts';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _client = createClient(url, key);
  return _client;
}

/**
 * Fetches payroll results for a given company, tax year and period.
 */
export async function fetchPayrollResults(
  companyId: string,
  taxYear: string,
  taxPeriod: number,
): Promise<PayrollResultRow[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('payroll_results')
    .select(`
      id, employee_id, company_id, tax_year, tax_period, payment_date,
      taxable_pay_this_period, income_tax_this_period, net_pay_this_period,
      nic_employee_this_period, nic_employer_this_period,
      employee_pension_this_period, employer_pension_this_period,
      student_loan_this_period, gross_pay_this_period,
      taxable_pay_ytd, income_tax_ytd, nic_employee_ytd, nic_employer_ytd,
      gross_earnings_for_nics_ytd, earnings_at_lel_ytd,
      earnings_lel_to_pt_ytd, earnings_pt_to_uel_ytd,
      student_loan_ytd, employee_pension_ytd,
      nhs_pension_employee_ytd, nhs_pension_employer_ytd
    `)
    .eq('company_id', companyId)
    .eq('tax_year', taxYear)
    .eq('tax_period', taxPeriod);

  if (error) throw new Error(`fetchPayrollResults: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error(
      `No payroll results found for company ${companyId}, ${taxYear} period ${taxPeriod}`
    );
  }

  // Map DB column names (this_period) to the interface names used by fps-builder
  return data.map((row: Record<string, unknown>) => ({
    id: row.id,
    employee_id: row.employee_id,
    company_id: row.company_id,
    tax_year: row.tax_year,
    tax_period: row.tax_period,
    payment_date: row.payment_date,
    taxable_pay: (row.taxable_pay_this_period as number) / 100,
    income_tax: (row.income_tax_this_period as number) / 100,
    net_pay: (row.net_pay_this_period as number) / 100,
    nic_employee: (row.nic_employee_this_period as number) / 100,
    nic_employer: (row.nic_employer_this_period as number) / 100,
    employee_pension: (row.employee_pension_this_period as number) / 100,
    employer_pension: (row.employer_pension_this_period as number) / 100,
    student_loan: (row.student_loan_this_period as number) / 100,
    gross_pay: (row.gross_pay_this_period as number) / 100,
    smp: null,
    spp: null,
    sap: null,
    shpp: null,
    taxable_pay_ytd: (row.taxable_pay_ytd as number) / 100,
    income_tax_ytd: (row.income_tax_ytd as number) / 100,
    nic_employee_ytd: (row.nic_employee_ytd as number) / 100,
    nic_employer_ytd: (row.nic_employer_ytd as number) / 100,
    gross_earnings_for_nics_ytd: (row.gross_earnings_for_nics_ytd as number) / 100,
    earnings_at_lel_ytd: (row.earnings_at_lel_ytd as number) / 100,
    earnings_lel_to_pt_ytd: (row.earnings_lel_to_pt_ytd as number) / 100,
    earnings_pt_to_uel_ytd: (row.earnings_pt_to_uel_ytd as number) / 100,
    student_loan_ytd: (row.student_loan_ytd as number) / 100,
    employee_pension_ytd: (row.employee_pension_ytd as number) / 100,
    nhs_pension_employee_ytd: (row.nhs_pension_employee_ytd as number) / 100,
    nhs_pension_employer_ytd: (row.nhs_pension_employer_ytd as number) / 100,
    smp_ytd: null,
    spp_ytd: null,
    sap_ytd: null,
    shpp_ytd: null,
  })) as PayrollResultRow[];
}

/**
 * Fetches employee records for the given employee IDs.
 */
export async function fetchEmployees(
  employeeIds: string[],
): Promise<EmployeeRow[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('employees')
    .select(`
      id, first_name, last_name, gender, date_of_birth,
      national_insurance_number,
      address1, address2, address3, address4, postcode,
      tax_code, nic_code, week_one_month_one,
      student_loan_plan, hours_worked_band,
      payroll_id, hire_date,
      has_p45, p46_statement,
      taxable_pay_ytd, tax_paid_ytd
    `)
    .in('id', employeeIds);

  if (error) throw new Error(`fetchEmployees: ${error.message}`);
  if (!data) return [];

  return data as EmployeeRow[];
}

/**
 * Fetches employee IDs that had payroll results in the previous tax period.
 * Used to detect starters.
 */
export async function fetchPreviousPeriodResults(
  companyId: string,
  taxYear: string,
  taxPeriod: number,
  employeeIds: string[],
): Promise<Set<string>> {
  if (taxPeriod <= 1) return new Set();

  const supabase = getClient();

  const { data, error } = await supabase
    .from('payroll_results')
    .select('employee_id')
    .eq('company_id', companyId)
    .eq('tax_year', taxYear)
    .eq('tax_period', taxPeriod - 1)
    .in('employee_id', employeeIds);

  if (error) throw new Error(`fetchPreviousPeriodResults: ${error.message}`);

  return new Set((data ?? []).map((r: { employee_id: string }) => r.employee_id));
}

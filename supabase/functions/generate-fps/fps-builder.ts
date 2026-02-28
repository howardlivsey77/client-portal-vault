/**
 * FPS data builder
 * Merges payroll result rows with employee records and produces
 * the FpsEmployee shape consumed by the XML generator.
 */

import { EmployeeRow, FpsEmployee, NiBandData, PayrollResultRow } from './types.ts';

const fmt = (n: number): string => n.toFixed(2);
const fmtOrNull = (n: number | null | undefined): string | null =>
  n != null && n !== 0 ? fmt(n) : null;

// Penny-to-pounds: DB stores all monetary values in pennies
const p = (n: number): string => (n / 100).toFixed(2);
const pOrNull = (n: number | null | undefined): string | null =>
  n != null && n !== 0 ? p(n) : null;

function resolveHoursWorkedBand(
  band: 'A' | 'B' | 'C' | 'D' | 'E' | null
): 'A' | 'B' | 'C' | 'D' | 'E' {
  return band ?? 'E';
}

function buildAddressLines(emp: EmployeeRow): string[] {
  return [emp.address1, emp.address2, emp.address3, emp.address4]
    .map((l) => (l ?? '').trim())
    .filter(Boolean);
}

function cleanTaxCode(taxCode: string): { code: string; isMonth1: boolean; isScottish: boolean } {
  let code = taxCode.trim().toUpperCase();
  const isMonth1 = /[\/\-]?(W1|M1)$/.test(code);
  if (isMonth1) {
    code = code.replace(/[\/\-]?(W1|M1)$/, '').trim();
  }
  const isScottish = code.startsWith('S');
  if (isScottish) {
    code = code.slice(1);
  }
  return { code, isMonth1, isScottish };
}

function resolvePaymentDate(result: PayrollResultRow, taxYear: string, taxPeriod: number): string {
  if (result.payment_date) return result.payment_date;
  const yearStart = parseInt(taxYear.slice(0, 4), 10);
  const month = ((taxPeriod - 1 + 3) % 12) + 1;
  const year = taxPeriod <= 9 ? yearStart : yearStart + 1;
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function resolveStarterInfo(
  emp: EmployeeRow,
  taxPeriod: number,
  previousPeriodEmployeeIds: Set<string>,
): { isStarter: boolean; startDate: string | null; startDeclaration: 'A' | 'B' | 'C' | null } {
  const isStarter = taxPeriod === 1
    ? (emp.hire_date != null)
    : !previousPeriodEmployeeIds.has(emp.id);

  if (!isStarter) {
    return { isStarter: false, startDate: null, startDeclaration: null };
  }

  return {
    isStarter: true,
    startDate: emp.hire_date ?? null,
    startDeclaration: emp.has_p45 ? null : ((emp.p46_statement as 'A' | 'B' | 'C' | null) ?? 'A'),
  };
}

function buildNiData(emp: EmployeeRow, result: PayrollResultRow): NiBandData {
  return {
    letter: emp.nic_code,
    grossEarningsForNICsInPd: p(result.gross_pay ?? 0),
    grossEarningsForNICsYtd:  p(result.gross_earnings_for_nics_ytd ?? 0),
    atLelYtd:                 p(result.earnings_at_lel_ytd ?? 0),
    lelToPtYtd:               p(result.earnings_lel_to_pt_ytd ?? 0),
    ptToUelYtd:               p(result.earnings_pt_to_uel_ytd ?? 0),
    totalEmpNICInPd:          p(result.nic_employer ?? 0),
    totalEmpNICYtd:           p(result.nic_employer_ytd ?? 0),
    empeeContribnsInPd:       p(result.nic_employee ?? 0),
    empeeContribnsYtd:        p(result.nic_employee_ytd ?? 0),
  };
}

function resolveStudentLoan(
  emp: EmployeeRow,
  result: PayrollResultRow,
): { studentLoanPlan: number | null; isPostgrad: boolean; studentLoanRecovered: string | null; postgradLoanRecovered: string | null; studentLoansYtd: string | null } {
  const plan = emp.student_loan_plan;
  const amount = result.student_loan ?? 0;
  const ytd = result.student_loan_ytd ?? 0;

  if (!plan || amount === 0) {
    return {
      studentLoanPlan: null,
      isPostgrad: false,
      studentLoanRecovered: null,
      postgradLoanRecovered: null,
      studentLoansYtd: ytd > 0 ? p(ytd) : null,
    };
  }

  const isPostgrad = plan === 3;
  return {
    studentLoanPlan: plan,
    isPostgrad,
    studentLoanRecovered: isPostgrad ? null : p(amount),
    postgradLoanRecovered: isPostgrad ? p(amount) : null,
    studentLoansYtd: ytd > 0 ? p(ytd) : null,
  };
}

/**
 * Main builder function.
 */
export function buildFpsEmployees(
  payrollResults: PayrollResultRow[],
  employees: EmployeeRow[],
  previousPeriodEmployeeIds: Set<string>,
  taxYear: string,
): FpsEmployee[] {
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  return payrollResults.map((result) => {
    const emp = employeeMap.get(result.employee_id);
    if (!emp) {
      throw new Error(`Employee record not found for payroll result employee_id: ${result.employee_id}`);
    }

    const { code: cleanedTaxCode, isMonth1, isScottish } = cleanTaxCode(emp.tax_code);
    const { isStarter, startDate, startDeclaration } = resolveStarterInfo(
      emp, result.tax_period, previousPeriodEmployeeIds
    );
    const { studentLoanPlan, isPostgrad, studentLoanRecovered, postgradLoanRecovered, studentLoansYtd } =
      resolveStudentLoan(emp, result);
    const niData = buildNiData(emp, result);

    const empPension = result.employee_pension ?? 0;
    const empPensionYtd = (result.employee_pension_ytd ?? 0) + (result.nhs_pension_employee_ytd ?? 0);

    return {
      employeeId: emp.id,
      payrollId: emp.payroll_id,
      nino: emp.national_insurance_number,
      firstName: emp.first_name,
      lastName: emp.last_name,
      gender: emp.gender,
      dateOfBirth: emp.date_of_birth,

      addressLines: buildAddressLines(emp),
      postcode: emp.postcode,

      taxCode: cleanedTaxCode,
      isMonth1Basis: isMonth1 || emp.week_one_month_one,
      isScottishTaxpayer: isScottish,
      nicLetter: emp.nic_code,
      hoursWorkedBand: resolveHoursWorkedBand(emp.hours_worked_band),

      studentLoanPlan,
      isPostgrad,

      isStarter,
      startDate,
      startDeclaration,

      paymentDate: resolvePaymentDate(result, taxYear, result.tax_period),
      taxPeriod: result.tax_period,
      payFrequency: 'M1',

      taxablePay:             p(result.taxable_pay),
      taxDeductedOrRefunded:  p(result.income_tax),
      payAfterStatDedns:      p(result.net_pay),
      empeePenContribnsPaid:  empPension > 0 ? p(empPension) : null,
      studentLoanRecovered,
      postgradLoanRecovered,

      taxablePayYtd:          p(result.taxable_pay_ytd),
      totalTaxYtd:            p(result.income_tax_ytd),
      empeePenContribnsYtd:   empPensionYtd > 0 ? p(empPensionYtd) : null,
      studentLoansYtd,

      smpYtd:  pOrNull(result.smp_ytd),
      sppYtd:  pOrNull(result.spp_ytd),
      sapYtd:  pOrNull(result.sap_ytd),
      shppYtd: pOrNull(result.shpp_ytd),

      niData,
    };
  });
}

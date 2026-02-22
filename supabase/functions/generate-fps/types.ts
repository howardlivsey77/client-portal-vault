/**
 * Shared TypeScript interfaces for the FPS (Full Payment Submission) edge function.
 */

export interface EmployerConfig {
  taxOfficeNumber: string;
  taxOfficeReference: string;
  accountsOfficeRef: string;
  gatewayUserId: string;
  gatewayPassword: string;
  vendorId: string;
  productName: string;
  productVersion: string;
  liveMode: boolean;
}

export interface FpsInput {
  companyId: string;
  taxYear: string;       // '2025/26'
  taxPeriod: number;     // 1–12
  finalSubmission?: boolean;
  schemeCeased?: boolean;
  dateSchemeCeased?: string;
  finalSubmissionForYear?: boolean;
}

export interface FpsResult {
  xml: string;
  employeeCount: number;
  taxYear: string;
  taxPeriod: number;
  generatedAt: string;
}

export interface NiBandData {
  letter: string;
  grossEarningsForNICsInPd: string;
  grossEarningsForNICsYtd: string;
  atLelYtd: string;
  lelToPtYtd: string;
  ptToUelYtd: string;
  totalEmpNICInPd: string;
  totalEmpNICYtd: string;
  empeeContribnsInPd: string;
  empeeContribnsYtd: string;
}

export interface FpsEmployee {
  employeeId: string;
  payrollId: string | null;
  nino: string | null;
  firstName: string;
  lastName: string;
  gender: string | null;
  dateOfBirth: string | null;

  addressLines: string[];
  postcode: string | null;

  taxCode: string;
  isMonth1Basis: boolean;
  isScottishTaxpayer: boolean;
  nicLetter: string | null;
  hoursWorkedBand: 'A' | 'B' | 'C' | 'D' | 'E';

  studentLoanPlan: number | null;
  isPostgrad: boolean;

  isStarter: boolean;
  startDate: string | null;
  startDeclaration: 'A' | 'B' | 'C' | null;

  paymentDate: string;
  taxPeriod: number;
  payFrequency: string;

  taxablePay: string;
  taxDeductedOrRefunded: string;
  payAfterStatDedns: string;
  empeePenContribnsPaid: string | null;
  studentLoanRecovered: string | null;
  postgradLoanRecovered: string | null;

  taxablePayYtd: string;
  totalTaxYtd: string;
  empeePenContribnsYtd: string | null;
  studentLoansYtd: string | null;

  smpYtd: string | null;
  sppYtd: string | null;
  sapYtd: string | null;
  shppYtd: string | null;

  niData: NiBandData;
}

/** Raw row shape from Supabase payroll_results table */
export interface PayrollResultRow {
  id: string;
  employee_id: string;
  company_id: string;
  tax_year: string;
  tax_period: number;
  payment_date: string | null;

  taxable_pay: number;
  income_tax: number;
  net_pay: number;
  nic_employee: number;
  nic_employer: number;
  employee_pension: number | null;
  employer_pension: number | null;
  student_loan: number | null;
  gross_pay: number;

  smp: number | null;
  spp: number | null;
  sap: number | null;
  shpp: number | null;

  taxable_pay_ytd: number;
  income_tax_ytd: number;
  nic_employee_ytd: number;
  nic_employer_ytd: number;
  gross_earnings_for_nics_ytd: number | null;
  earnings_at_lel_ytd: number | null;
  earnings_lel_to_pt_ytd: number | null;
  earnings_pt_to_uel_ytd: number | null;
  student_loan_ytd: number | null;
  employee_pension_ytd: number | null;
  nhs_pension_employee_ytd: number | null;
  nhs_pension_employer_ytd: number | null;

  smp_ytd: number | null;
  spp_ytd: number | null;
  sap_ytd: number | null;
  shpp_ytd: number | null;
}

/** Raw row shape from Supabase employees table */
export interface EmployeeRow {
  id: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  date_of_birth: string | null;
  national_insurance_number: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  postcode: string | null;
  tax_code: string;
  nic_code: string;
  week_one_month_one: boolean;
  student_loan_plan: number | null;
  hours_worked_band: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  payroll_id: string | null;
  hire_date: string | null;
  has_p45: boolean | null;
  p46_statement: string | null;
  taxable_pay_ytd: number | null;
  tax_paid_ytd: number | null;
}

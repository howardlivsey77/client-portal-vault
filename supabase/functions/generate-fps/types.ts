/**
 * RTI Service — shared types
 * Covers the data shapes fetched from Supabase and passed through the pipeline.
 */

// ── Supabase query results ────────────────────────────────────────────────────

export interface EmployeeRow {
  id: string;
  first_name: string;
  last_name: string;
  gender: 'M' | 'F' | null;
  date_of_birth: string;           // ISO date
  national_insurance_number: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  postcode: string | null;
  tax_code: string;
  nic_code: string;                // NI letter: A B C H J M V Z etc.
  week_one_month_one: boolean;
  student_loan_plan: number | null; // 1 2 4 = plan; null = none
  hours_worked_band: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  payroll_id: string | null;
  hire_date: string | null;        // ISO date — used for starter detection
  has_p45: boolean | null;
  p46_statement: 'A' | 'B' | 'C' | null;  // starter declaration
  taxable_pay_ytd: number | null;  // opening P45 balances (on employee record)
  tax_paid_ytd: number | null;
}

export interface PayrollResultRow {
  id: string;
  employee_id: string;
  company_id: string;
  tax_year: string;               // e.g. '2025/26'
  tax_period: number;             // 1–12
  payment_date: string | null;    // ISO date

  // Per-period figures (in pounds, decimal)
  taxable_pay: number;
  income_tax: number;
  net_pay: number;
  nic_employee: number;
  nic_employer: number;
  employee_pension: number;
  employer_pension: number;
  student_loan: number;
  gross_pay: number;

  // Statutory pay this period
  smp: number | null;
  spp: number | null;
  sap: number | null;
  shpp: number | null;

  // YTD cumulative figures
  taxable_pay_ytd: number;
  income_tax_ytd: number;
  nic_employee_ytd: number;
  nic_employer_ytd: number;
  gross_earnings_for_nics_ytd: number;
  earnings_at_lel_ytd: number;
  earnings_lel_to_pt_ytd: number;
  earnings_pt_to_uel_ytd: number;
  student_loan_ytd: number;
  employee_pension_ytd: number;
  nhs_pension_employee_ytd: number;
  nhs_pension_employer_ytd: number;
  smp_ytd: number | null;
  spp_ytd: number | null;
  sap_ytd: number | null;
  shpp_ytd: number | null;
}

// ── Enriched internal shape (merged employee + payroll result) ────────────────

export interface FpsEmployee {
  // Identity
  employeeId: string;
  payrollId: string | null;
  nino: string | null;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F' | null;
  dateOfBirth: string;

  // Address
  addressLines: string[];    // filtered non-empty from address1–4
  postcode: string | null;

  // Tax / NI
  taxCode: string;
  isMonth1Basis: boolean;
  isScottishTaxpayer: boolean;
  nicLetter: string;
  hoursWorkedBand: 'A' | 'B' | 'C' | 'D' | 'E';

  // Student loan
  studentLoanPlan: number | null;   // 1 2 4
  isPostgrad: boolean;              // plan 3 = PGL

  // Starter
  isStarter: boolean;
  startDate: string | null;
  startDeclaration: 'A' | 'B' | 'C' | null;

  // Payment
  paymentDate: string;
  taxPeriod: number;
  payFrequency: 'M1' | 'W1' | 'W2' | 'W4';  // monthly only for now

  // Per-period figures (£, 2dp string for XML)
  taxablePay: string;
  taxDeductedOrRefunded: string;
  payAfterStatDedns: string;
  empeePenContribnsPaid: string | null;
  studentLoanRecovered: string | null;
  postgradLoanRecovered: string | null;

  // YTD totals
  taxablePayYtd: string;
  totalTaxYtd: string;
  empeePenContribnsYtd: string | null;
  studentLoansYtd: string | null;

  // Statutory pay YTD (only emit if > 0)
  smpYtd: string | null;
  sppYtd: string | null;
  sapYtd: string | null;
  shppYtd: string | null;

  // NI earnings bands
  niData: NiBandData;
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

// ── Employer config (from env vars) ──────────────────────────────────────────

export interface EmployerConfig {
  taxOfficeNumber: string;       // e.g. '120'
  taxOfficeReference: string;    // e.g. 'BB58856'
  accountsOfficeRef: string;     // e.g. '120PZ01405637'
  gatewayUserId: string;
  gatewayPassword: string;
  vendorId: string;
  productName: string;
  productVersion: string;
  liveMode: boolean;
}

// ── FPS submission inputs ─────────────────────────────────────────────────────

export interface FpsInput {
  companyId: string;
  taxYear: string;               // '2025/26'
  taxPeriod: number;             // 1–12
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

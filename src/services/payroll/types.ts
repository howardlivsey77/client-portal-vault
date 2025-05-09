
/**
 * Types for payroll calculations
 */

export interface PayrollDetails {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
  taxCode: string;
  taxRegion?: 'UK' | 'Scotland' | 'Wales';
  pensionPercentage?: number;
  studentLoanPlan?: 1 | 2 | 4 | 5 | null;
  additionalDeductions?: Array<{ name: string, amount: number }>;
  additionalAllowances?: Array<{ name: string, amount: number }>;
  additionalEarnings?: Array<{ name: string, amount: number }>;
  nicCode?: string; // Added NIC code property
  
  // New properties for tax periods and previous data
  taxYear?: string; // e.g., "2025-2026"
  taxPeriod?: number; // 1-12 (April to March)
  previousTaxablePay?: number; // YTD taxable pay before this period
  previousTax?: number; // YTD tax paid before this period
  isNewEmployee?: boolean; // Whether this is the employee's first period
  useEmergencyTax?: boolean; // Whether to use emergency tax code (Week 1/Month 1)
}

export interface PayrollResult {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
  taxCode: string;
  taxRegion?: 'UK' | 'Scotland' | 'Wales';
  grossPay: number;
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  studentLoanPlan?: 1 | 2 | 4 | 5 | null;
  pensionContribution: number;
  pensionPercentage?: number;
  additionalDeductions: Array<{ name: string, amount: number }>;
  additionalAllowances: Array<{ name: string, amount: number }>;
  additionalEarnings: Array<{ name: string, amount: number }>;
  totalDeductions: number;
  totalAllowances: number;
  netPay: number;
  nicCode?: string; // Added NIC code property
  
  // New fields for YTD tracking and tax period
  taxYear: string; // e.g., "2025-2026"
  taxPeriod: number; // 1-12 (April to March)
  taxablePay: number; // Gross pay subject to tax
  taxablePayYTD: number; // YTD taxable pay including this period
  incomeTaxYTD: number; // YTD tax including this period
  nationalInsuranceYTD: number; // YTD NI including this period
  grossPayYTD: number; // YTD gross pay including this period
}

/**
 * UK Tax Year information
 */
export interface TaxYearInfo {
  taxYear: string; // e.g., "2025-2026"
  startDate: Date; // April 6
  endDate: Date;   // April 5 of next year
  currentPeriod: number; // 1-12
}

/**
 * Previous period summary for YTD calculations
 */
export interface PreviousPeriodData {
  grossPayYTD: number;
  taxablePayYTD: number;
  incomeTaxYTD: number;
  nationalInsuranceYTD: number;
  lastPeriod: number;
}


/**
 * Types for payroll calculations
 */

export interface TaxCode {
  code: string;
  allowance: number;  // Annual tax-free allowance in pounds
  monthlyAllowance: number; // Monthly tax-free allowance in pounds
}

export interface PayrollResult {
  employeeId?: string;
  employeeName?: string;
  payrollId: string;
  monthlySalary: number;
  grossPay: number;
  taxCode: string;
  taxRegion: string;
  taxYear: string;
  taxPeriod: number;
  taxablePay: number;
  taxFreeAmount: number;
  incomeTax: number;
  nationalInsurance: number;
  nicCode: string;
  studentLoan: number;
  studentLoanPlan?: number | null;
  pensionContribution: number;
  pensionPercentage: number;
  totalDeductions: number;
  netPay: number;
  additionalEarnings: { name: string; amount: number }[];
  additionalDeductions: { name: string; amount: number }[];
  additionalAllowances: { name: string; amount: number }[];
  totalAllowances: number;
  grossPayYTD: number;
  taxablePayYTD: number;
  incomeTaxYTD: number;
  nationalInsuranceYTD: number;
  studentLoanYTD: number;
}

export interface PayrollDetails {
  employeeId?: string;
  employeeName?: string;
  payrollId?: string;
  monthlySalary: number;
  taxCode: string;
  taxRegion?: string;
  taxYear?: string;
  taxPeriod?: number;
  nicCode?: string;
  studentLoanPlan?: number | null;
  pensionPercentage?: number;
  additionalEarnings?: { name: string; amount: number }[];
  additionalDeductions?: { name: string; amount: number }[];
  additionalAllowances?: { name: string; amount: number }[];
}

/**
 * Interface for previous period data used in YTD calculations
 */
export interface PreviousPeriodData {
  grossPayYTD: number;
  taxablePayYTD: number;
  incomeTaxYTD: number;
  nationalInsuranceYTD: number;
  studentLoanYTD: number;
  lastPeriod?: number; // Added as optional to fix existing code
}


/**
 * Types for payroll calculations
 */

export interface PayrollDetails {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
  taxCode: string;
  pensionPercentage?: number;
  studentLoanPlan?: 1 | 2 | 4 | 5 | 6 | null;
  additionalDeductions?: Array<{ description: string, amount: number }>;
  additionalAllowances?: Array<{ description: string, amount: number }>;
  additionalEarnings?: Array<{ description: string, amount: number }>;
  // NHS Pension fields
  isNHSPensionMember?: boolean;
  previousYearPensionablePay?: number | null;
  // Tax year - optional, defaults to current tax year if not provided
  taxYear?: string;
}

export interface PayrollResult {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
  grossPay: number;
  taxablePay: number; 
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  studentLoanPlan?: 1 | 2 | 4 | 5 | 6 | null;
  pensionContribution: number;
  pensionPercentage?: number;
  additionalDeductions: Array<{ description: string, amount: number }>;
  additionalAllowances: Array<{ description: string, amount: number }>;
  additionalEarnings: Array<{ description: string, amount: number }>;
  totalDeductions: number;
  totalAllowances: number;
  netPay: number;
  freePay: number;
  taxCode: string;
  // Add NI earnings band fields
  earningsAtLEL: number;
  earningsLELtoPT: number;
  earningsPTtoUEL: number;
  earningsAboveUEL: number;
  earningsAboveST: number;
  // NHS Pension fields
  nhsPensionEmployeeContribution: number;
  nhsPensionEmployerContribution: number;
  nhsPensionTier: number;
  nhsPensionEmployeeRate: number;
  nhsPensionEmployerRate: number;
  isNHSPensionMember: boolean;
}

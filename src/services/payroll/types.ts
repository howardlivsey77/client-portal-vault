
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
  studentLoanPlan?: 1 | 2 | 4 | 5 | null;
  additionalDeductions?: Array<{ description: string, amount: number }>;
  additionalAllowances?: Array<{ description: string, amount: number }>;
}

export interface PayrollResult {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  grossPay: number;
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  pensionContribution: number;
  additionalDeductions: Array<{ description: string, amount: number }>;
  additionalAllowances: Array<{ description: string, amount: number }>;
  totalDeductions: number;
  totalAllowances: number;
  netPay: number;
}

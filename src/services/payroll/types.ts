
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
}

export interface PayrollResult {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
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
}

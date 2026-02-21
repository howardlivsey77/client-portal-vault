
/**
 * Types for payroll calculations
 */

import type { NICategory } from "./constants/tax-constants";

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
  // NI category letter - optional, defaults to 'A' if not provided
  niCategory?: NICategory;
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
  employerNationalInsurance: number;  // Employer NI contribution
  studentLoan: number;
  studentLoanPlan?: 1 | 2 | 4 | 5 | 6 | null;
  pensionContribution: number;
  pensionPercentage?: number;
  additionalDeductions: Array<{ description: string, amount: number }>;
  additionalAllowances: Array<{ description: string, amount: number }>;
  additionalEarnings: Array<{ description: string, amount: number }>;
  sicknessNote?: string; // Note about sickness days included in salary
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
  // NI category
  niCategory: NICategory;
}

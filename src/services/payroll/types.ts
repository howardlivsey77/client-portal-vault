
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
  studentLoanPlan?: 1 | 2 | 4 | 'PGL' | null;
  additionalDeductions?: Array<{ description: string, amount: number }>;
  additionalAllowances?: Array<{ description: string, amount: number }>;
  additionalEarnings?: Array<{ description: string, amount: number }>;
  // Non-NI-able expense reimbursements — included in gross pay for display
  // but excluded from NI, income tax, pension, and student loan calculations.
  reimbursements?: Array<{ description: string, amount: number }>;
  // NHS Pension fields
  isNHSPensionMember?: boolean;
  previousYearPensionablePay?: number | null;
  // Tax year - optional, defaults to current tax year if not provided
  taxYear?: string;
  // NI category letter - optional, defaults to 'A' if not provided
  niCategory?: NICategory;

  // Tax calculation basis
  // isMonth1Basis: true = non-cumulative (W1/M1), false/absent = cumulative
  isMonth1Basis?: boolean;

  // YTD figures — required for cumulative calculation.
  // For new starters or migrations, pass starter figures from P45 or previous system.
  // For ongoing employees, the app calculates and stores these each period.
  // If absent, defaults to 0 (correct for period 1 of the tax year).
  period?: number;          // Tax month (1–12). Defaults to current period if absent.
  grossPayYTD?: number;     // Gross pay year to date BEFORE this period's pay is added.
  taxPaidYTD?: number;      // Income tax paid year to date BEFORE this period.
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
  studentLoanPlan?: 1 | 2 | 4 | 'PGL' | null;
  pensionContribution: number;
  pensionPercentage?: number;
  additionalDeductions: Array<{ description: string, amount: number }>;
  additionalAllowances: Array<{ description: string, amount: number }>;
  additionalEarnings: Array<{ description: string, amount: number }>;
  // Non-NI-able expense reimbursements — passed through to result for display
  reimbursements: Array<{ description: string, amount: number }>;
  // NI-able gross pay (grossPay minus reimbursements) — used as earnings base
  // for NI, income tax, pension, and student loan calculations
  niableGrossPay: number;
  sicknessNote?: string; // Note about sickness days included in salary
  totalDeductions: number;
  totalAllowances: number;
  netPay: number;
  freePay: number;          // Monthly free pay for payslip display
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

  // Tax calculation audit fields
  period: number;
  grossPayYTD: number;      // Gross pay YTD AFTER this period (input grossPayYTD + niableGrossPay)
  taxPaidYTD: number;       // Tax paid YTD AFTER this period (input taxPaidYTD + incomeTax)
  isMonth1Basis: boolean;
  taxablePayYTD: number;    // Cumulative taxable pay from the tax engine
  freePayYTD: number;       // Free pay used in YTD calculation
}

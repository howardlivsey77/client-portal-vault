
/**
 * Types for payroll calculations
 */

export interface TaxCode {
  code: string;
  allowance: number;  // Annual tax-free allowance in pounds
  monthlyAllowance: number; // Monthly tax-free allowance in pounds
}

export interface PayrollResult {
  employeeId: string;
  employeeName: string;
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
  studentLoanPlan: string | null;
  pensionContribution: number;
  pensionPercentage: number;
  totalDeductions: number;
  netPay: number;
  additionalEarnings: { id: string; description: string; amount: number; }[];
  additionalDeductions: { id: string; description: string; amount: number; }[];
  additionalAllowances: { id: string; description: string; amount: number; }[];
  totalAllowances: number; // Total of all additional allowances
  grossPayYTD?: number;
  taxablePayYTD?: number;
  incomeTaxYTD?: number;
  nationalInsuranceYTD?: number;
  studentLoanYTD?: number;
}

export interface PayrollDetails {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
  taxCode: string;
  taxRegion?: string;
  taxYear?: string;
  taxPeriod?: number;
  useEmergencyTax?: boolean;
  isNewEmployee?: boolean;
  pensionPercentage?: number;
  studentLoanPlan?: string | null;
  additionalEarnings?: { id: string; description: string; amount: number; }[];
  additionalDeductions?: { id: string; description: string; amount: number; }[];
  additionalAllowances?: { id: string; description: string; amount: number; }[];
  nicCode?: string;
}

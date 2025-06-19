
export interface PayrollFormValues {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
  taxCode: string;
  pensionPercentage: number;
  studentLoanPlan: 1 | 2 | 4 | 5 | null;
  additionalDeductions: Array<{ description: string; amount: number }>;
  additionalAllowances: Array<{ description: string; amount: number }>;
  additionalEarnings: Array<{ description: string; amount: number }>;
  // NHS Pension fields
  isNHSPensionMember: boolean;
  previousYearPensionablePay?: number | null;
}

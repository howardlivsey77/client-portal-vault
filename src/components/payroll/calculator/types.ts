export interface AdditionalItem {
  name: string;
  amount: number;
}

export interface PayrollCalculatorProps {
  employeeId?: string;
  employeeName?: string;
  monthlySalary?: number;
}

export interface PayrollFormValues {
  employeeId: string;
  employeeName: string;
  payrollId: string;
  monthlySalary: number;
  taxCode: string;
  taxRegion?: 'UK' | 'Scotland' | 'Wales';
  pensionPercentage: number;
  studentLoanPlan: 1 | 2 | 4 | 5 | null;
  additionalDeductions: AdditionalItem[];
  additionalAllowances: AdditionalItem[];
  additionalEarnings: AdditionalItem[];
}

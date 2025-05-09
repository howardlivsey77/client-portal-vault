
export interface AdditionalItem {
  name: string;
  amount: number;
}

export interface PayrollCalculatorProps {
  employeeId?: string;
  employeeName?: string;
  monthlySalary?: number;
  employee?: any; // Allow passing the employee object directly
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
  nicCode?: string;
  taxYear?: string;
  taxPeriod?: number;
  useEmergencyTax?: boolean;
  isNewEmployee?: boolean;
}

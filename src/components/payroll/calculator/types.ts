
import { Employee } from "@/hooks/useEmployees";

export interface PayrollCalculatorProps {
  employee?: Employee | null;
}

export interface PayrollFormValues {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
  taxCode: string;
  pensionPercentage: number;
  studentLoanPlan: 1 | 2 | 4 | 5 | null;
  additionalDeductions: Array<{ description: string, amount: number }>;
  additionalAllowances: Array<{ description: string, amount: number }>;
}

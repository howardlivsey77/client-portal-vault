
import { Employee } from "@/types/employeeDetails";

export interface WorkDay {
  day: string;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
  payrollId: string | null;
}

export interface WorkPatternCardProps {
  employee: Employee;
  isAdmin: boolean;
  refetchEmployeeData: () => Promise<void>;
  updateEmployeeField?: (fieldName: string, value: any) => Promise<boolean>;
}

export interface SicknessScheme {
  id: string;
  name: string;
}

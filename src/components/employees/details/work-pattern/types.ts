
import { Employee } from "@/hooks/useEmployeeDetails";

export interface WorkDay {
  day: string;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface WorkPatternCardProps {
  employee: Employee;
  isAdmin: boolean;
  refetchEmployeeData: () => Promise<void>;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

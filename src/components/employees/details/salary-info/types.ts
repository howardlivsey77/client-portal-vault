
import { Employee } from "@/types";

export interface SalaryInfoProps {
  employee: Employee;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
  canEdit?: boolean;
}

export interface SalaryInfoFormValues {
  hours_per_week: number;
  hourly_rate: number;
  rate_2: number | null;
  rate_3: number | null;
  rate_4: number | null;
}

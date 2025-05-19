
import { Employee } from "@/types/employeeDetails";

export interface PersonalInfoProps {
  employee: Employee;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export interface PersonalInfoFormValues {
  first_name: string;
  last_name: string;
  department: string;
  gender: "Male" | "Female" | "Other" | "Prefer not to say" | null;
  payroll_id: string | null;
  date_of_birth: Date | null;
  hire_date: Date;
  hours_per_week: number;
  hourly_rate: number;
  rate_2: number | null;
  rate_3: number | null;
  rate_4: number | null;
}

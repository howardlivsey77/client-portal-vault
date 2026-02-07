
import { Employee } from "@/types";

export interface PersonalInfoProps {
  employee: Employee;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export interface PersonalInfoFormValues {
  first_name: string;
  last_name: string;
  department: string;
  cost_centre: string | null;
  gender: "Male" | "Female" | "Other" | "Prefer not to say" | null;
  payroll_id: string | null;
  date_of_birth: Date | null;
  hire_date: Date;
}

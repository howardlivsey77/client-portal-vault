
import { EmployeeFormValues } from "@/types/employee";

export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  department: string;
  hours_per_week: number;
  hourly_rate: number;
  date_of_birth: Date | null;
  hire_date: Date;
  email: string;
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  postcode: string;
  payroll_id?: string;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say";
  work_pattern: string;
  rate_2?: number;
  rate_3?: number;
  rate_4?: number;
  tax_code: string;
  week_one_month_one: boolean;
  nic_code: string;
  student_loan_plan: number | null;
  nhs_pension_member: boolean;
  previous_year_pensionable_pay: number | null;
  nhs_pension_tier: number | null;
  nhs_pension_employee_rate: number | null;
  monthly_salary: number | null;
}

export interface UseEmployeeFormReturn {
  form: any;
  loading: boolean;
  isEditMode: boolean;
  readOnly: boolean;
  submitLoading: boolean;
  setReadOnly: (readOnly: boolean) => void;
  fetchEmployeeData: () => Promise<void>;
  onSubmit: (data: EmployeeFormValues) => Promise<void>;
}

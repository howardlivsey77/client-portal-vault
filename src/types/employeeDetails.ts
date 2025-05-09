
// Extending the basic Employee type with additional fields for the details view
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  hire_date: string;
  hours_per_week: number | null;
  hourly_rate: number | null;
  rate_2: number | null;
  rate_3: number | null;
  rate_4: number | null;
  email: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  postcode: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  date_of_birth: string | null;
  payroll_id: string | null;
  gender: string | null;
  work_pattern: string | null;
}

export interface EmployeeDetailsHookReturn {
  employee: Employee | null;
  loading: boolean;
  isAdmin: boolean;
  formattedAddress: string;
  nextEmployeeId: string | null;
  prevEmployeeId: string | null;
  navigateToEmployee: (id: string | null) => void;
  deleteEmployee: () => Promise<void>;
  fetchEmployeeData: () => Promise<void>;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

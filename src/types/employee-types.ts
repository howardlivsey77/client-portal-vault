
/**
 * Core Employee type definitions
 */

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  cost_centre: string | null;
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
  monthly_salary: number | null;
  company_id?: string | null; // Add company_id field from our new database structure
  sickness_scheme_id?: string | null; // Add sickness scheme ID
  status: string | null;
  leave_date: string | null;
  invitation_sent_at: string | null;
  portal_access_enabled: boolean | null;
  
  // HMRC section fields
  national_insurance_number: string | null;
  tax_code: string | null;
  week_one_month_one: boolean | null;
  nic_code: string | null;
  student_loan_plan: number | null;
  hours_worked_band: string | null;
  
  // NHS Pension fields
  nhs_pension_member: boolean | null;
  previous_year_pensionable_pay: number | null;
  nhs_pension_tier: number | null;
  nhs_pension_employee_rate: number | null;
}

/**
 * Extended employee interfaces for specific use cases
 */

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
  isOwnRecord: boolean;
}

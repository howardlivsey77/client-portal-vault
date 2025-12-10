
// Types for employee import
export interface EmployeeData {
  [key: string]: any;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string | null;
}

// Required fields that must be mapped for import to succeed
export const requiredFields = [
  "first_name",
  "last_name"
];

// All available fields for mapping - all employee table columns
export const availableFields = [
  "first_name",
  "last_name",
  "department",
  "hours_per_week",
  "hourly_rate",
  "date_of_birth",
  "hire_date",
  "email",
  "address1",
  "address2",
  "address3",
  "address4",
  "postcode",
  "payroll_id",
  "gender",
  "rate_2",
  "rate_3",
  "rate_4",
  "national_insurance_number",
  "nic_code",
  "tax_code"
];

// Human-readable field labels
export const fieldLabels: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  department: "Department",
  hours_per_week: "Hours Per Week",
  hourly_rate: "Hourly Rate",
  date_of_birth: "Date of Birth",
  hire_date: "Hire Date",
  email: "Email Address",
  address1: "Address Line 1",
  address2: "Address Line 2",
  address3: "Address Line 3",
  address4: "Address Line 4",
  postcode: "Postcode",
  payroll_id: "Payroll ID",
  gender: "Gender",
  rate_2: "Rate 2",
  rate_3: "Rate 3",
  rate_4: "Rate 4",
  national_insurance_number: "National Insurance Number",
  nic_code: "NIC Code",
  tax_code: "Tax Code"
};

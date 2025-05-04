
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
  "last_name",
  "job_title",
  "department",
  "salary"
];

// All available fields for mapping - all employee table columns
export const availableFields = [
  "first_name",
  "last_name",
  "job_title",
  "department",
  "salary",
  "hours_per_week",
  "hourly_rate",
  "date_of_birth",
  "hire_date",
  "email",
  "phone_number",
  "address1",
  "address2",
  "address3",
  "address4",
  "postcode",
  "emergency_contact"
];

// Human-readable field labels
export const fieldLabels: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  job_title: "Job Title",
  department: "Department",
  salary: "Salary",
  hours_per_week: "Hours Per Week",
  hourly_rate: "Hourly Rate",
  date_of_birth: "Date of Birth",
  hire_date: "Hire Date",
  email: "Email Address",
  phone_number: "Phone Number",
  address1: "Address Line 1",
  address2: "Address Line 2",
  address3: "Address Line 3",
  address4: "Address Line 4",
  postcode: "Postcode",
  emergency_contact: "Emergency Contact"
};

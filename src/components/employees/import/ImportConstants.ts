
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
  "department"
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
  // Work pattern fields - one for each day of the week
  "monday_working",
  "monday_start_time",
  "monday_end_time",
  "tuesday_working",
  "tuesday_start_time",
  "tuesday_end_time",
  "wednesday_working",
  "wednesday_start_time",
  "wednesday_end_time",
  "thursday_working",
  "thursday_start_time",
  "thursday_end_time",
  "friday_working",
  "friday_start_time",
  "friday_end_time",
  "saturday_working",
  "saturday_start_time",
  "saturday_end_time",
  "sunday_working",
  "sunday_start_time",
  "sunday_end_time"
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
  // Work pattern fields
  monday_working: "Monday Working",
  monday_start_time: "Monday Start Time",
  monday_end_time: "Monday End Time",
  tuesday_working: "Tuesday Working",
  tuesday_start_time: "Tuesday Start Time",
  tuesday_end_time: "Tuesday End Time",
  wednesday_working: "Wednesday Working",
  wednesday_start_time: "Wednesday Start Time",
  wednesday_end_time: "Wednesday End Time",
  thursday_working: "Thursday Working",
  thursday_start_time: "Thursday Start Time",
  thursday_end_time: "Thursday End Time",
  friday_working: "Friday Working",
  friday_start_time: "Friday Start Time",
  friday_end_time: "Friday End Time",
  saturday_working: "Saturday Working",
  saturday_start_time: "Saturday Start Time",
  saturday_end_time: "Saturday End Time",
  sunday_working: "Sunday Working",
  sunday_start_time: "Sunday Start Time",
  sunday_end_time: "Sunday End Time"
};

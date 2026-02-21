
import { z } from "zod";
import { HmrcTaxCodeSchema } from "@/services/payroll/validation/payroll-validators";

// Define work pattern schema
export const workDaySchema = z.object({
  day: z.string(),
  isWorking: z.boolean(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
});

export type WorkDay = z.infer<typeof workDaySchema>;

// Custom validation for National Insurance Number
const nationalInsuranceNumberValidation = z.string().optional().refine(
  (val) => {
    if (!val || val.trim() === '') return true; // Allow empty
    const cleaned = val.replace(/\s/g, '').toUpperCase();
    const niPattern = /^[A-CEGHJ-PR-TW-Z]{2}[0-9]{6}[A-D]$/;
    if (!niPattern.test(cleaned)) return false;
    const invalidPrefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];
    return !invalidPrefixes.includes(cleaned.substring(0, 2));
  },
  {
    message: "Invalid National Insurance Number format (expected: QQ123456C)"
  }
);

// Custom validation for NIC Code
const nicCodeValidation = z.string().optional().refine(
  (val) => {
    if (!val || val.trim() === '') return true; // Allow empty
    const validCodes = ['A', 'B', 'C', 'H', 'J', 'M', 'Z'];
    return validCodes.includes(val.toUpperCase().trim());
  },
  {
    message: "Invalid NIC Code (must be A, B, C, H, J, M, or Z)"
  }
);

// Define form schema using zod
export const employeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  department: z.string().min(1, "Department is required"),
  cost_centre: z.string().optional().nullable(),
  hours_per_week: z.coerce.number().min(0, "Hours per week must be a positive number").default(40),
  hourly_rate: z.coerce.number().min(0, "Hourly rate must be a positive number").default(0),
  rate_2: z.coerce.number().min(0, "Rate must be a positive number").nullable().optional(),
  rate_3: z.coerce.number().min(0, "Rate must be a positive number").nullable().optional(),
  rate_4: z.coerce.number().min(0, "Rate must be a positive number").nullable().optional(),
  date_of_birth: z.date().optional().nullable(),
  hire_date: z.date().default(() => new Date()),
  email: z.string().email("Invalid email address").optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  address4: z.string().optional(),
  postcode: z.string().optional(),
  payroll_id: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional(),
  work_pattern: z.string().optional(),
  // HMRC fields
  tax_code: HmrcTaxCodeSchema.optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  week_one_month_one: z.boolean().optional().nullable(),
  nic_code: nicCodeValidation.nullable(),
  student_loan_plan: z.number().min(1).max(4).optional().nullable().or(z.literal(6).optional().nullable()),
  // P45/P46 fields
  has_p45: z.boolean().optional().nullable(),
  taxable_pay_ytd: z.coerce.number().min(0, "Taxable pay YTD must be a positive number").optional().nullable(),
  tax_paid_ytd: z.coerce.number().optional().nullable(), // Can be negative for refunds
  p46_statement: z.enum(["A", "B", "C"]).optional().nullable(),
  // NHS Pension fields
  nhs_pension_member: z.boolean().optional().nullable(),
  previous_year_pensionable_pay: z.coerce.number().min(0, "Previous year pensionable pay must be a positive number").optional().nullable(),
  nhs_pension_tier: z.number().min(1).max(9).optional().nullable(),
  nhs_pension_employee_rate: z.coerce.number().min(0).max(100, "Rate must be between 0 and 100").optional().nullable(),
  // New fields
  national_insurance_number: nationalInsuranceNumberValidation.nullable(),
  monthly_salary: z.coerce.number().min(0, "Monthly salary must be a positive number").optional().nullable(),
  // Status and leave date fields
  status: z.enum(["active", "on-hold", "leaver"]).default("active"),
  leave_date: z.date().optional().nullable(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const genderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
  { label: "Prefer not to say", value: "Prefer not to say" }
];

export const defaultWorkPattern = [
  { day: "Monday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Tuesday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Wednesday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Thursday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Friday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Saturday", isWorking: false, startTime: null, endTime: null },
  { day: "Sunday", isWorking: false, startTime: null, endTime: null },
];

// HMRC options
export const studentLoanPlanOptions = [
  { label: "None", value: null },
  { label: "Plan 1", value: 1 },
  { label: "Plan 2", value: 2 },
  { label: "Plan 4", value: 4 },
  { label: "Postgraduate Loan (PGL)", value: 6 },
];

export const nicCodeOptions = [
  { label: "A - Standard", value: "A" },
  { label: "B - Married Women's Reduced Rate", value: "B" },
  { label: "C - Over State Pension Age", value: "C" },
  { label: "H - Apprentice under 25", value: "H" },
  { label: "J - Under 21", value: "J" },
  { label: "M - Under 21 Deferment", value: "M" },
  { label: "Z - No NI Contribution", value: "Z" },
];

export const p46StatementOptions = [
  { 
    value: "A", 
    label: "Statement A",
    description: "This is my first job since 6 April and since the 6 April I have not received payments from any of the following: Jobseeker's Allowance, Employment and Support Allowance, Incapacity Benefit"
  },
  { 
    value: "B", 
    label: "Statement B",
    description: "Since 6 April I have had another job but I do not have a P45. And/or since the 6 April I have received payments from any of the following: Jobseeker's Allowance, Employment and Support Allowance, Incapacity Benefit"
  },
  { 
    value: "C", 
    label: "Statement C",
    description: "I have another job and/or I am in receipt of a State, Works or Private Pension"
  },
];

export const statusOptions = [
  { label: "Active", value: "active" },
  { label: "On Hold", value: "on-hold" },
  { label: "Leaver", value: "leaver" },
];

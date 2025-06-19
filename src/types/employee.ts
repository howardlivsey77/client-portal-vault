
import { z } from "zod";

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
  tax_code: z.string().optional().nullable(),
  week_one_month_one: z.boolean().optional().nullable(),
  nic_code: nicCodeValidation.nullable(),
  student_loan_plan: z.number().min(1).max(6).optional().nullable(),
  // New fields
  national_insurance_number: nationalInsuranceNumberValidation.nullable(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const departments = [
  "Engineering",
  "Sales",
  "Marketing",
  "Human Resources",
  "Finance",
  "Operations",
  "Customer Support",
  "Research & Development",
  "Legal",
  "Executive",
];

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
  { label: "Plan 5", value: 5 },
  { label: "Plan 6 (Postgraduate)", value: 6 },
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

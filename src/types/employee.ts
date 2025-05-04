
import { z } from "zod";

// Define form schema using zod
export const employeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  job_title: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  salary: z.coerce.number().min(0, "Salary must be a positive number"),
  hours_per_week: z.coerce.number().min(0, "Hours per week must be a positive number").default(40),
  hourly_rate: z.coerce.number().min(0, "Hourly rate must be a positive number").default(0),
  date_of_birth: z.date().optional().nullable(),
  hire_date: z.date().default(() => new Date()),
  email: z.string().email("Invalid email address").optional(),
  phone_number: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  address4: z.string().optional(),
  postcode: z.string().optional(),
  emergency_contact: z.string().optional(),
  payroll_id: z.string().optional(),
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

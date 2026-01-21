
import { z } from "zod";

// Form schema
export const personalInfoSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  department: z.string().min(1, "Department is required"),
  cost_centre: z.string().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional().nullable(),
  payroll_id: z.string().optional().nullable(),
  date_of_birth: z.date().optional().nullable(),
  hire_date: z.date().optional(),
});

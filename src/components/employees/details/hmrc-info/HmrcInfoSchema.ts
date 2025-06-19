
import { z } from "zod";

export const hmrcInfoSchema = z.object({
  tax_code: z.string().optional(),
  week_one_month_one: z.boolean().default(false),
  nic_code: z.string().optional(),
  student_loan_plan: z.number().min(1).max(6).nullable().optional(),
});

export type HmrcInfoFormValues = z.infer<typeof hmrcInfoSchema>;

import { z } from "zod";
import { HmrcTaxCodeSchema } from "@/services/payroll/validation/payroll-validators";

export const hmrcInfoSchema = z.object({
  national_insurance_number: z.string().optional(),
  tax_code: HmrcTaxCodeSchema.optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  week_one_month_one: z.boolean().default(false),
  nic_code: z.string().optional(),
  student_loan_plan: z.number().min(1).max(6).nullable().optional(),
});

export type HmrcInfoFormValues = z.infer<typeof hmrcInfoSchema>;

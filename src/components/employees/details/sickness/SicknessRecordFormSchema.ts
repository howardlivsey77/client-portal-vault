
import { z } from "zod";

export const sicknessRecordSchema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  total_days: z.number().min(0, "Total days must be positive"),
  is_certified: z.boolean().default(false),
  certification_required_from_day: z.number().min(1).default(8),
  reason: z.string().optional(),
  notes: z.string().optional()
});

export type SicknessRecordFormData = z.infer<typeof sicknessRecordSchema>;

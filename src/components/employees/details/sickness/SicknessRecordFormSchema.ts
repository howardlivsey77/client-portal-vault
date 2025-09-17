
import { z } from "zod";

export const sicknessRecordSchema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  total_days: z.number().min(0, "Total days must be positive"),
  is_certified: z.boolean().default(false),
  certification_required_from_day: z.number().min(1).default(8),
  reason: z.string().optional(),
  notes: z.string().optional()
}).refine((data) => {
  if (data.end_date && data.start_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"]
});

export type SicknessRecordFormData = z.infer<typeof sicknessRecordSchema>;

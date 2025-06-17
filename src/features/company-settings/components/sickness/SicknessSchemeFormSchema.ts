
import { z } from "zod";

export const sicknessSchemeFormSchema = z.object({
  name: z.string().min(1, "Scheme name is required")
});

export type SicknessSchemeFormData = z.infer<typeof sicknessSchemeFormSchema>;

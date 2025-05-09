
import { z } from "zod";

// Define the schema for timesheet settings
export const timesheetSettingsSchema = z.object({
  earlyClockInTolerance: z.coerce.number().min(0).max(60),
  lateClockInTolerance: z.coerce.number().min(0).max(60),
  earlyClockOutTolerance: z.coerce.number().min(0).max(60),
  lateClockOutTolerance: z.coerce.number().min(0).max(60),
  roundClockTimes: z.boolean().default(false),
  roundingIntervalMinutes: z.coerce.number().min(1).max(30).optional(),
  requireManagerApproval: z.boolean().default(true),
  allowEmployeeNotes: z.boolean().default(true)
});

export type TimesheetSettingsFormValues = z.infer<typeof timesheetSettingsSchema>;

export const defaultSettingsValues: TimesheetSettingsFormValues = {
  earlyClockInTolerance: 15,
  lateClockInTolerance: 5,
  earlyClockOutTolerance: 5,
  lateClockOutTolerance: 15,
  roundClockTimes: true,
  roundingIntervalMinutes: 15,
  requireManagerApproval: true,
  allowEmployeeNotes: true
};

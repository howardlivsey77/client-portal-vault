
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { TimesheetSettingsFormValues } from "./schema";

interface ClockOutTolerancesSectionProps {
  form: UseFormReturn<TimesheetSettingsFormValues>;
}

export function ClockOutTolerancesSection({ form }: ClockOutTolerancesSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Clock-out Tolerances</h3>
      
      <FormField
        control={form.control}
        name="earlyClockOutTolerance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Early Clock-out Tolerance (minutes)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormDescription>
              How many minutes before scheduled end time an employee can clock out.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="lateClockOutTolerance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Late Clock-out Tolerance (minutes)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormDescription>
              How many minutes after scheduled end time before overtime is counted.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

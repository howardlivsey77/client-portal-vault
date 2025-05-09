
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { TimesheetSettingsFormValues } from "./schema";

interface ClockInTolerancesSectionProps {
  form: UseFormReturn<TimesheetSettingsFormValues>;
}

export function ClockInTolerancesSection({ form }: ClockInTolerancesSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Clock-in Tolerances</h3>
      
      <FormField
        control={form.control}
        name="earlyClockInTolerance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Early Clock-in Tolerance (minutes)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormDescription>
              How many minutes before scheduled start time an employee can clock in.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="lateClockInTolerance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Late Clock-in Tolerance (minutes)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormDescription>
              How many minutes after scheduled start time before considered late.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

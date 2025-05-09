
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { TimesheetSettingsFormValues } from "./schema";

interface TimeRoundingSectionProps {
  form: UseFormReturn<TimesheetSettingsFormValues>;
}

export function TimeRoundingSection({ form }: TimeRoundingSectionProps) {
  const roundClockTimes = form.watch("roundClockTimes");
  
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="text-lg font-medium">Time Rounding</h3>
      
      <FormField
        control={form.control}
        name="roundClockTimes"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Round Clock Times</FormLabel>
              <FormDescription>
                Round clock-in and clock-out times to the nearest interval.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {roundClockTimes && (
        <FormField
          control={form.control}
          name="roundingIntervalMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rounding Interval (minutes)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Times will be rounded to the nearest interval (e.g., 15 minutes).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

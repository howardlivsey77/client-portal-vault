
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn, useWatch } from "react-hook-form";
import { SicknessRecordFormData } from "./SicknessRecordFormSchema";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { calculateWorkingDaysForRecord } from "./utils/workingDaysCalculations";
import { useEffect } from "react";

interface SicknessRecordFormFieldsProps {
  form: UseFormReturn<SicknessRecordFormData>;
  workPattern?: WorkDay[];
}

export const SicknessRecordFormFields = ({ form, workPattern }: SicknessRecordFormFieldsProps) => {
  const { control } = form;
  const startDate = useWatch({ control, name: "start_date" });
  const endDate = useWatch({ control, name: "end_date" });

  // Calculate working days in real-time as dates change
  useEffect(() => {
    if (startDate && workPattern) {
      const workingDays = calculateWorkingDaysForRecord(startDate, endDate || null, workPattern);
      form.setValue('total_days', workingDays);
    }
  }, [startDate, endDate, workPattern, form]);

  const calculatedWorkingDays = startDate && workPattern 
    ? calculateWorkingDaysForRecord(startDate, endDate || null, workPattern)
    : 0;

  return (
    <>
      <FormField
        control={control}
        name="start_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Start Date</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="end_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>End Date (optional)</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="total_days"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Working Days (calculated automatically)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.5"
                value={calculatedWorkingDays}
                placeholder="Will be calculated based on work pattern"
                disabled
                className="bg-muted"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="is_certified"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Medically Certified</FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reason (optional)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Brief description of illness" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes (optional)</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Additional notes or comments"
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

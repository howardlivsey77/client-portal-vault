
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Control } from "react-hook-form";
import { SicknessRecordFormData } from "./SicknessRecordFormSchema";

interface SicknessRecordFormFieldsProps {
  control: Control<SicknessRecordFormData>;
}

export const SicknessRecordFormFields = ({ control }: SicknessRecordFormFieldsProps) => {
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
            <FormLabel>Total Days</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.5"
                {...field} 
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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

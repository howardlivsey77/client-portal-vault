
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types/employee";

interface CompensationFieldsProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
}

export const CompensationFields = ({ form, readOnly }: CompensationFieldsProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">      
      <FormField
        control={form.control}
        name="hours_per_week"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hours Per Week *</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="40"
                min={0}
                step="0.5"
                {...field} 
                disabled={readOnly}
              />
            </FormControl>
            <FormDescription>Standard working hours per week</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="hourly_rate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hourly Rate (GBP) *</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="0.00"
                min={0}
                step="0.01"
                {...field} 
                disabled={readOnly}
              />
            </FormControl>
            <FormDescription>For hourly employees or overtime</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

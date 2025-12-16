import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EmployeeFormValues } from "@/types";
import { calculateMonthlySalary } from "@/lib/formatters";

interface PayStepProps {
  form: UseFormReturn<EmployeeFormValues>;
}

export const PayStep = ({ form }: PayStepProps) => {
  const hoursPerWeek = form.watch("hours_per_week");
  const hourlyRate = form.watch("hourly_rate");

  useEffect(() => {
    if (hourlyRate > 0 && hoursPerWeek > 0) {
      const calculatedSalary = calculateMonthlySalary(hourlyRate, hoursPerWeek);
      form.setValue("monthly_salary", calculatedSalary);
    } else {
      form.setValue("monthly_salary", null);
    }
  }, [hourlyRate, hoursPerWeek, form]);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="hours_per_week"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hours per Week *</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.5"
                placeholder="40"
                className="bg-white"
                value={field.value === 0 ? "" : field.value}
                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>
              Standard contracted hours
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="hourly_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate (£) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-white"
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Base pay rate per hour
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthly_salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Salary (£)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="—"
                  className="bg-muted"
                  readOnly
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Auto-calculated from hourly rate × hours
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

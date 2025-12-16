import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmployeeFormValues } from "@/types";

interface PensionStepProps {
  form: UseFormReturn<EmployeeFormValues>;
}

export const PensionStep = ({ form }: PensionStepProps) => {
  const isNhsMember = form.watch("nhs_pension_member");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          NHS Pension (Optional)
        </h4>

        <FormField
          control={form.control}
          name="nhs_pension_member"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">NHS Pension Member</FormLabel>
                <FormDescription>
                  Is this employee part of the NHS Pension Scheme?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isNhsMember && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in-50 duration-200">
            <FormField
              control={form.control}
              name="previous_year_pensionable_pay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Year Pensionable Pay (£)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="bg-white"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Used to calculate pension tier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nhs_pension_tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pension Tier (1-9)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="9"
                      placeholder="Auto-calculated"
                      className="bg-white"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave blank for auto-calculation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};


import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeFormValues } from "@/types/employee";

interface NhsPensionFieldsProps {
  control: Control<EmployeeFormValues>;
  readOnly: boolean;
}

export const NhsPensionFields = ({ control, readOnly }: NhsPensionFieldsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>NHS Pension Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="nhs_pension_member"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  NHS Pension Scheme Member
                </FormLabel>
                <div className="text-sm text-muted-foreground">
                  Is this employee a member of the NHS Pension Scheme?
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                  disabled={readOnly}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="previous_year_pensionable_pay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous Year Pensionable Pay (£)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    readOnly={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="nhs_pension_tier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NHS Pension Tier</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="9"
                    placeholder="Auto-calculated"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    readOnly={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="nhs_pension_employee_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NHS Pension Employee Rate (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Auto-calculated"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  readOnly={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABLE_FINANCIAL_YEARS, generatePayPeriodsForFinancialYear } from "@/services/payroll/utils/financial-year-utils";
import { AlertCircle, Info } from "lucide-react";

interface PayrollSettingsSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

export function PayrollSettingsSection({ control, disabled }: PayrollSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">Payroll Migration Settings</h3>
      </div>
      
      <div className="flex items-start gap-2 rounded-md border border-muted bg-muted/30 p-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          If migrating mid-year from another payroll provider, specify when this company will start processing payroll in this system. 
          Leave as Period 1 for new companies starting from the beginning of the tax year.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="payrollStartYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Year</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AVAILABLE_FINANCIAL_YEARS.map((fy) => (
                    <SelectItem key={fy.year} value={fy.year.toString()}>
                      {fy.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The tax year when payroll processing begins
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="payrollStartPeriod"
          render={({ field }) => {
            const selectedYear = control._formValues?.payrollStartYear;
            const periods = selectedYear ? generatePayPeriodsForFinancialYear(selectedYear) : [];
            
            return (
              <FormItem>
                <FormLabel>Starting Period</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString() || ""}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select starting period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.periodNumber} value={period.periodNumber.toString()}>
                        Period {period.periodNumber} - {period.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The first period to run payroll (Period 1 = April)
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          <strong>Note:</strong> If starting mid-year, employee YTD balances from the previous provider will need to be entered separately to ensure accurate tax and NI calculations.
        </p>
      </div>
    </div>
  );
}

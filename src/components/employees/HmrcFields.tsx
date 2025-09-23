
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { studentLoanPlanOptions, nicCodeOptions } from "@/types/employee";
import { EmployeeFormValues } from "@/types/employee";
import { Label } from "@/components/ui/label";

interface HmrcFieldsProps {
  control: Control<EmployeeFormValues>;
  readOnly: boolean;
}

export const HmrcFields = ({ control, readOnly }: HmrcFieldsProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">HMRC Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="tax_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 1257L"
                  {...field}
                  value={field.value || ""}
                  readOnly={readOnly}
                  className={readOnly ? "bg-gray-100" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="nic_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIC Code</FormLabel>
              <Select
                disabled={readOnly}
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger className={readOnly ? "bg-gray-100" : ""}>
                    <SelectValue placeholder="Select NIC code" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {nicCodeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="student_loan_plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Loan Plan</FormLabel>
              <Select
                disabled={readOnly}
                onValueChange={(value) => field.onChange(value === "null" ? null : Number(value))}
                value={field.value === null ? "null" : field.value?.toString() || "null"}
              >
                <FormControl>
                  <SelectTrigger className={readOnly ? "bg-gray-100" : ""}>
                    <SelectValue placeholder="Select student loan plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {studentLoanPlanOptions.map((option) => (
                    <SelectItem 
                      key={option.value === null ? "null" : option.value} 
                      value={option.value === null ? "null" : option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="week_one_month_one"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Week One/Month One
                </FormLabel>
                <div className="text-sm text-muted-foreground">
                  Emergency tax basis
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
      </div>
    </div>
  );
};

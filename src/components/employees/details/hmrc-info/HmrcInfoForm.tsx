
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { hmrcInfoSchema, HmrcInfoFormValues } from "./HmrcInfoSchema";
import { Button } from "@/components/ui/button";
import { Employee, studentLoanPlanOptions, nicCodeOptions, hoursWorkedBandOptions, HOURS_WORKED_BANDS, suggestHoursBand } from "@/types";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Check } from "lucide-react";
import { NINumberInput } from "../../NINumberInput";

interface HmrcInfoFormProps {
  employee: Employee;
  isEditing: boolean;
  toggleEditMode: () => void;
  onSubmit: (data: HmrcInfoFormValues) => Promise<boolean>;
}

export const HmrcInfoForm = ({ 
  employee, 
  isEditing, 
  toggleEditMode, 
  onSubmit 
}: HmrcInfoFormProps) => {
  const form = useForm<HmrcInfoFormValues>({
    resolver: zodResolver(hmrcInfoSchema),
    defaultValues: {
      national_insurance_number: (employee.national_insurance_number || "").replace(/\s/g, ""),
      tax_code: employee.tax_code || "",
      week_one_month_one: employee.week_one_month_one || false,
      nic_code: employee.nic_code || "",
      student_loan_plan: employee.student_loan_plan,
      hours_worked_band: (employee.hours_worked_band as "A" | "B" | "C" | "D" | "E") || null,
    }
  });

  const handleSubmit = async (values: HmrcInfoFormValues) => {
    const success = await onSubmit(values);
    if (success) {
      toggleEditMode();
    }
  };

  const currentBand = form.watch("hours_worked_band");
  const suggestedBand = suggestHoursBand(employee.hours_per_week);
  const showSuggestion = !currentBand && suggestedBand && employee.hours_per_week;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="national_insurance_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National Insurance Number</FormLabel>
                <FormControl>
                  <NINumberInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tax_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 1257L" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
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
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nic_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIC Code</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
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
          
          <FormField
            control={form.control}
            name="student_loan_plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Loan Plan</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "null" ? null : Number(value))}
                  value={field.value === null ? "null" : field.value?.toString() || "null"}
                >
                  <FormControl>
                    <SelectTrigger>
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
        </div>

        <FormField
          control={form.control}
          name="hours_worked_band"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weekly Hours Normally Worked</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "null" ? null : value)}
                value={field.value || "null"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hours band" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Not specified</SelectItem>
                  {hoursWorkedBandOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showSuggestion && (
                <p className="text-xs text-muted-foreground mt-1">
                  Based on contracted hours ({employee.hours_per_week} hrs/week), suggested band: {HOURS_WORKED_BANDS[suggestedBand]}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={toggleEditMode}
            className="gap-1"
          >
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" className="gap-1">
            <Check className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};

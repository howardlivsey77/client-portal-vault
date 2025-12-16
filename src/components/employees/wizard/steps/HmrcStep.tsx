import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues, nicCodeOptions, studentLoanPlanOptions } from "@/types";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NINumberInput } from "@/components/employees/NINumberInput";
import { TaxCodeInput } from "@/components/employees/TaxCodeInput";

// Helper function to determine NI category based on date of birth
const getNicCodeFromDateOfBirth = (dob: Date | string | null | undefined): string => {
  if (!dob) return "A";
  
  const birthDate = typeof dob === "string" ? new Date(dob) : dob;
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 21) return "M";
  if (age >= 66) return "C";
  return "A";
};

interface HmrcStepProps {
  form: UseFormReturn<EmployeeFormValues>;
}

export function HmrcStep({ form }: HmrcStepProps) {
  const dateOfBirth = form.watch("date_of_birth");

  // Auto-populate NI category based on date of birth
  useEffect(() => {
    if (dateOfBirth) {
      const suggestedNicCode = getNicCodeFromDateOfBirth(dateOfBirth);
      const currentNicCode = form.getValues("nic_code");
      
      if (!currentNicCode || ["A", "M", "C"].includes(currentNicCode)) {
        form.setValue("nic_code", suggestedNicCode);
      }
    }
  }, [dateOfBirth, form]);

  return (
    <div className="space-y-4">
      {/* Tax Code, NI Number, and NI Category - 3 column grid */}
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="tax_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Code</FormLabel>
              <FormControl>
                <TaxCodeInput
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="national_insurance_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NI Number</FormLabel>
              <FormControl>
                <NINumberInput
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nic_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NI Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select NI category" />
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
            </FormItem>
          )}
        />
      </div>

      {/* Student Loan and Week 1/Month 1 */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="student_loan_plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Loan Plan</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))} 
                value={field.value === null ? "null" : field.value?.toString() || "null"}
              >
                <FormControl>
                  <SelectTrigger className="bg-white">
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
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="week_one_month_one"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-[72px]">
              <div className="space-y-0.5">
                <FormLabel>Week 1/Month 1</FormLabel>
                <FormDescription className="text-xs">
                  Non-cumulative tax basis
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
      </div>
    </div>
  );
}

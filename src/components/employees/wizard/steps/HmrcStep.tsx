import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmployeeFormValues, studentLoanPlanOptions, nicCodeOptions } from "@/types";
import { TaxCodeInput } from "../../TaxCodeInput";
import { NINumberInput } from "../../NINumberInput";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getNicCodeFromDateOfBirth = (dob: Date | string | null | undefined): string => {
  if (!dob) return "A";
  
  const dobDate = typeof dob === "string" ? new Date(dob) : dob;
  if (isNaN(dobDate.getTime())) return "A";
  
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }
  
  if (age < 21) return "M";  // Under 21
  if (age >= 66) return "C"; // Over State Pension Age
  return "A";                // Standard
};

interface HmrcStepProps {
  form: UseFormReturn<EmployeeFormValues>;
}

export const HmrcStep = ({ form }: HmrcStepProps) => {
  const dateOfBirth = form.watch("date_of_birth");

  useEffect(() => {
    const nicCode = getNicCodeFromDateOfBirth(dateOfBirth);
    form.setValue("nic_code", nicCode);
  }, [dateOfBirth, form]);

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="national_insurance_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>National Insurance Number</FormLabel>
            <FormControl>
              <NINumberInput
                value={field.value || ""}
                onChange={field.onChange}
                disabled={false}
              />
            </FormControl>
            <FormDescription>
              Format: QQ123456C (2 letters, 6 numbers, 1 letter)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="tax_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Tax Code
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>The tax code from HMRC determines how much income tax to deduct. Common codes: 1257L (standard), BR (basic rate), 0T.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <TaxCodeInput
                  value={field.value || ""}
                  onChange={field.onChange}
                  disabled={false}
                  className="bg-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nic_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                NI Category
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>National Insurance category letter. Most employees use 'A'. Special categories exist for under 21s, apprentices, and those over state pension age.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
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
              <FormDescription>
                Auto-selected based on age. Can be changed if needed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="student_loan_plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Loan</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "null" ? null : Number(value))}
                value={field.value === null ? "null" : field.value?.toString() || "null"}
              >
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="None" />
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
              <FormDescription>
                If employee has student loan deductions
              </FormDescription>
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
                <FormLabel className="text-base">Week 1/Month 1</FormLabel>
                <FormDescription>
                  Emergency tax basis
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
};

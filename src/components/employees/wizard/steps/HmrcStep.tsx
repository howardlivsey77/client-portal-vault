import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EmployeeFormValues, studentLoanPlanOptions, nicCodeOptions, p46StatementOptions } from "@/types";
import { TaxCodeInput } from "../../TaxCodeInput";
import { NINumberInput } from "../../NINumberInput";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
  const hasP45 = form.watch("has_p45");
  const p46Statement = form.watch("p46_statement");

  useEffect(() => {
    const nicCode = getNicCodeFromDateOfBirth(dateOfBirth);
    form.setValue("nic_code", nicCode);
  }, [dateOfBirth, form]);

  // Auto-populate tax code based on P46 statement
  useEffect(() => {
    if (hasP45 === false && p46Statement) {
      if (p46Statement === "A" || p46Statement === "B") {
        form.setValue("tax_code", "1257L");
        form.setValue("week_one_month_one", false);
      } else if (p46Statement === "C") {
        form.setValue("tax_code", "BR");
        form.setValue("week_one_month_one", true);
      }
    }
  }, [hasP45, p46Statement, form]);

  return (
    <div className="space-y-3">
      {/* P45 Question */}
      <FormField
        control={form.control}
        name="has_p45"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-blue-200 p-3 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <div className="space-y-0.5">
              <FormLabel className="text-base font-medium">Does the employee have a P45?</FormLabel>
              <FormDescription className="text-xs">
                From previous employer when leaving a job
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value === true}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  // Clear opposite fields when toggling
                  if (checked) {
                    form.setValue("p46_statement", null);
                  } else {
                    form.setValue("taxable_pay_ytd", null);
                    form.setValue("tax_paid_ytd", null);
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* P45 Details - Show when has P45 */}
      {hasP45 === true && (
        <div className="space-y-3 rounded-lg border p-3 bg-background">
          <h4 className="font-medium text-sm text-muted-foreground">P45 Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="taxable_pay_ytd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxable Pay to Date (£)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="bg-white"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">From P45 Part 1A, box 5</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tax_paid_ytd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Paid to Date (£)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="bg-white"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">From P45 Part 1A, box 6</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {/* P46 Statement - Show when no P45 */}
      {hasP45 === false && (
        <div className="space-y-2 rounded-lg border p-3 bg-background">
          <h4 className="font-medium text-sm text-muted-foreground">New Starter Declaration (P46)</h4>
          <FormField
            control={form.control}
            name="p46_statement"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    className="space-y-1"
                  >
                    {p46StatementOptions.map((option) => (
                      <div key={option.value} className="flex items-start space-x-3 py-1.5 hover:bg-muted/50 rounded px-2 -mx-2">
                        <RadioGroupItem value={option.value} id={`p46-${option.value}`} className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor={`p46-${option.value}`} className="text-sm font-medium cursor-pointer">
                            {option.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <Separator />

      {/* NI Number, Tax Code, NI Category - 3 column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  disabled={false}
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
              <FormLabel className="flex items-center gap-1">
                Tax Code
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>The tax code from HMRC. Common: 1257L (standard), BR (basic rate), 0T.</p>
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
              <FormLabel className="flex items-center gap-1">
                NI Category
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger type="button">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>NI category letter. Most use 'A'. Special for under 21s, apprentices, over pension age.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select" />
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

      {/* Student Loan and Week 1/Month 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="week_one_month_one"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Week 1/Month 1</FormLabel>
                <FormDescription className="text-xs">
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

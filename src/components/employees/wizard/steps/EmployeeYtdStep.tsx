import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect } from "react";

interface EmployeeYtdStepProps {
  form: UseFormReturn<EmployeeFormValues>;
}

const p46Options = [
  {
    value: "A",
    label: "Statement A",
    description: "This is their first job since 6 April and they haven't been receiving taxable benefits",
  },
  {
    value: "B",
    label: "Statement B",
    description: "This is now their only job, but they've had another job since 6 April",
  },
  {
    value: "C",
    label: "Statement C",
    description: "They have another job or receive a State/Occupational Pension",
  },
];

export function EmployeeYtdStep({ form }: EmployeeYtdStepProps) {
  const hasP45 = form.watch("has_p45");
  const p46Statement = form.watch("p46_statement");

  // Auto-populate tax code based on P46 statement when no P45
  useEffect(() => {
    if (!hasP45 && p46Statement) {
      const currentTaxCode = form.getValues("tax_code");
      // Only auto-populate if tax code is empty or was previously auto-set
      if (!currentTaxCode || ["1257L", "BR", "0T"].includes(currentTaxCode)) {
        let taxCode = "";
        let weekOneMonthOne = false;
        
        switch (p46Statement) {
          case "A":
            taxCode = "1257L";
            weekOneMonthOne = false;
            break;
          case "B":
            taxCode = "1257L";
            weekOneMonthOne = true;
            break;
          case "C":
            taxCode = "BR";
            weekOneMonthOne = false;
            break;
        }
        
        if (taxCode) {
          form.setValue("tax_code", taxCode);
          form.setValue("week_one_month_one", weekOneMonthOne);
        }
      }
    }
  }, [hasP45, p46Statement, form]);

  return (
    <div className="space-y-4">
      {/* P45 Toggle */}
      <FormField
        control={form.control}
        name="has_p45"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Has P45?</FormLabel>
              <FormDescription className="text-xs">
                Does this employee have a P45 from their previous employer?
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

      {hasP45 ? (
        /* P45 Details */
        <div className="rounded-lg border p-3 space-y-3">
          <h4 className="font-medium text-sm">P45 Details</h4>
          <div className="grid grid-cols-2 gap-4">
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
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
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
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      ) : (
        /* P46 Statement Selection */
        <div className="rounded-lg border p-3 space-y-3">
          <h4 className="font-medium text-sm">P46 Statement (Starter Declaration)</h4>
          <p className="text-xs text-muted-foreground">
            Select the statement that applies to this employee
          </p>
          <FormField
            control={form.control}
            name="p46_statement"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    className="space-y-1"
                  >
                    {p46Options.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-start space-x-3 py-1.5 hover:bg-muted/50 rounded px-2 cursor-pointer"
                        onClick={() => field.onChange(option.value)}
                      >
                        <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                        <div className="space-y-0.5 flex-1">
                          <label
                            htmlFor={option.value}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {option.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}

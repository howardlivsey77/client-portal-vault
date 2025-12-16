
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types";

interface PayrollIdFieldProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
  isEditMode?: boolean;
}

export const PayrollIdField = ({ form, readOnly, isEditMode = false }: PayrollIdFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="payroll_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Payroll ID</FormLabel>
          <FormControl>
            <Input 
              placeholder="Enter unique payroll identifier" 
              {...field} 
              value={field.value || ""}
              disabled={readOnly}
            />
          </FormControl>
          <FormDescription>
            {!isEditMode 
              ? "Next available payroll ID (auto-generated). You can change it if needed."
              : "Unique identifier used for payroll systems"
            }
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

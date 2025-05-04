
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types/employee";

interface JobInfoFieldsProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
  departments: string[];
}

export const JobInfoFields = ({ form, readOnly, departments }: JobInfoFieldsProps) => {
  return (
    <FormField
      control={form.control}
      name="department"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Department *</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value || undefined}
            disabled={readOnly}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

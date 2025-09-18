
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types/employee";
import { useDepartments } from "@/hooks/useDepartments";

interface JobInfoFieldsProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
}

export const JobInfoFields = ({ form, readOnly }: JobInfoFieldsProps) => {
  const { departmentNames, loading } = useDepartments();

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
            disabled={readOnly || loading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading departments..." : "Select a department"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {departmentNames.map((dept) => (
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

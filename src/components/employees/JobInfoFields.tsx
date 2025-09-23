
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
  
  console.log("JobInfoFields: departmentNames:", departmentNames, "loading:", loading);

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
              {departmentNames.length === 0 && !loading && (
                <SelectItem value="no-departments" disabled>
                  No departments found - Create departments in Department Management
                </SelectItem>
              )}
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

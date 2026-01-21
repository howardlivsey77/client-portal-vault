
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types";
import { useDepartments, useCostCentres } from "@/hooks";

interface JobInfoFieldsProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
}

export const JobInfoFields = ({ form, readOnly }: JobInfoFieldsProps) => {
  const { departmentNames, loading: departmentsLoading } = useDepartments();
  const { costCentres, loading: costCentresLoading } = useCostCentres();
  
  const costCentreNames = costCentres.map(cc => cc.name);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="department"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department *</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || undefined}
              disabled={readOnly || departmentsLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={departmentsLoading ? "Loading departments..." : "Select a department"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-background">
                {departmentNames.length === 0 && !departmentsLoading && (
                  <SelectItem value="no-departments" disabled>
                    No departments found - Create departments in Department Management
                  </SelectItem>
                )}
                {/* Show current value if set and not yet in loaded list */}
                {field.value && !departmentNames.includes(field.value) && (
                  <SelectItem key={field.value} value={field.value}>
                    {field.value}
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

      <FormField
        control={form.control}
        name="cost_centre"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cost Centre</FormLabel>
            <Select 
              onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
              value={field.value || "none"}
              disabled={readOnly || costCentresLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={costCentresLoading ? "Loading cost centres..." : "Select a cost centre"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-background">
                <SelectItem value="none">None</SelectItem>
                {costCentreNames.length === 0 && !costCentresLoading && (
                  <SelectItem value="no-cost-centres" disabled>
                    No cost centres found - Create cost centres in Company Settings
                  </SelectItem>
                )}
                {/* Show current value if set and not yet in loaded list */}
                {field.value && field.value !== "none" && !costCentreNames.includes(field.value) && (
                  <SelectItem key={field.value} value={field.value}>
                    {field.value}
                  </SelectItem>
                )}
                {costCentreNames.map((cc) => (
                  <SelectItem key={cc} value={cc}>
                    {cc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeeFormValues, statusOptions } from "@/types";
import { DateInputField } from "../../DateInputField";
import { Department } from "@/services/employees/departmentService";
import { CostCentre } from "@/services/employees/costCentreService";

interface EmploymentInfoStepProps {
  form: UseFormReturn<EmployeeFormValues>;
  departments: Department[];
  departmentsLoading: boolean;
  costCentres?: CostCentre[];
  costCentresLoading?: boolean;
}

export const EmploymentInfoStep = ({ 
  form, 
  departments, 
  departmentsLoading,
  costCentres = [],
  costCentresLoading = false
}: EmploymentInfoStepProps) => {
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
              disabled={departmentsLoading}
            >
              <FormControl>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={departmentsLoading ? "Loading..." : "Select department"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {departments.length === 0 && !departmentsLoading ? (
                  <SelectItem value="_no_departments" disabled>
                    No departments found
                  </SelectItem>
                ) : (
                  departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Which team or department will this employee work in?
            </FormDescription>
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
              disabled={costCentresLoading}
            >
              <FormControl>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={costCentresLoading ? "Loading..." : "Select cost centre"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {costCentres.length === 0 && !costCentresLoading ? (
                  <SelectItem value="_no_cost_centres" disabled>
                    No cost centres found
                  </SelectItem>
                ) : (
                  costCentres.map((cc) => (
                    <SelectItem key={cc.id} value={cc.name}>
                      {cc.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Optional cost centre for budget allocation
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <DateInputField
          control={form.control}
          name="hire_date"
          label="Start Date *"
          required
          readOnly={false}
          inputClassName="bg-white"
        />

        <FormField
          control={form.control}
          name="payroll_id"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Payroll ID</FormLabel>
              <FormControl>
                <Input placeholder="Auto-generated" className="bg-white" {...field} />
              </FormControl>
              <FormDescription>
                Auto-generated. Change if needed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Employment Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || "active"}>
              <FormControl>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {statusOptions.map((option) => (
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
  );
};

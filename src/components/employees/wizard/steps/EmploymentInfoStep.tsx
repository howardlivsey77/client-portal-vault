import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeeFormValues, statusOptions } from "@/types";
import { DateInputField } from "../../DateInputField";
import { Department } from "@/services/employees/departmentService";

interface EmploymentInfoStepProps {
  form: UseFormReturn<EmployeeFormValues>;
  departments: Department[];
  departmentsLoading: boolean;
}

export const EmploymentInfoStep = ({ form, departments, departmentsLoading }: EmploymentInfoStepProps) => {
  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="hours_per_week"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours per Week *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="40"
                  className="bg-white"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Standard contracted hours
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
    </div>
  );
};

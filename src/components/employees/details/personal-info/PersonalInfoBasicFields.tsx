
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { genderOptions } from "@/types";
import { useDepartments } from "@/hooks";
import { useCostCentres } from "@/hooks/employees/useCostCentres";
import { PersonalInfoFormValues } from "./types";
import { useNavigate } from "react-router-dom";

interface PersonalInfoBasicFieldsProps {
  control: Control<PersonalInfoFormValues>;
}

export const PersonalInfoBasicFields = ({ control }: PersonalInfoBasicFieldsProps) => {
  const { departmentNames, loading } = useDepartments();
  const { costCentreNames, loading: costCentresLoading } = useCostCentres();
  const navigate = useNavigate();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <FormField
            control={control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormField
            control={control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div>
        <FormField
          control={control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading departments..." : "Select a department"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departmentNames.length === 0 && !loading && (
                    <SelectItem value="no-departments" disabled>
                      No departments found
                    </SelectItem>
                  )}
                  {/* Always include current value if set and not in list yet (handles loading state) */}
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
              {departmentNames.length === 0 && !loading && (
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-sm text-muted-foreground">
                    No departments found.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/settings/company/departments')}
                    className="text-xs"
                  >
                    Create Departments
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </FormItem>
          )}
        />
      </div>

      <div>
        <FormField
          control={control}
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
                  <SelectTrigger>
                    <SelectValue placeholder={costCentresLoading ? "Loading cost centres..." : "Select a cost centre"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {/* Always include current value if set and not in list yet (handles loading state) */}
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
              {costCentreNames.length === 0 && !costCentresLoading && (
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-sm text-muted-foreground">
                    No cost centres found.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/settings/company/cost-centres')}
                    className="text-xs"
                  >
                    Create Cost Centres
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </FormItem>
          )}
        />
      </div>

      <div>
        <FormField
          control={control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {genderOptions.map((option) => (
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

      <div>
        <FormField
          control={control}
          name="payroll_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payroll ID</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

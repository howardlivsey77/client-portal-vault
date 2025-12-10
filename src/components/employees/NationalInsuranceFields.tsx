
import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nicCodeOptions, EmployeeFormValues } from "@/types";
import { NINumberInput } from "./NINumberInput";

interface NationalInsuranceFieldsProps {
  control: Control<EmployeeFormValues>;
  readOnly: boolean;
}

export const NationalInsuranceFields = ({ control, readOnly }: NationalInsuranceFieldsProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">National Insurance Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="national_insurance_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>National Insurance Number</FormLabel>
              <FormControl>
                <NINumberInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="nic_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIC Code</FormLabel>
              <Select
                disabled={readOnly}
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger className={readOnly ? "bg-gray-100" : ""}>
                    <SelectValue placeholder="Select NIC code" />
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
    </div>
  );
};

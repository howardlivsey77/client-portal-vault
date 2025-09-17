
import { Control } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EmployeeFormValues } from "@/types/employee";
import { GenderField } from "./GenderField";
import { DateInputField } from "./DateInputField";

interface PersonalInfoFieldsProps {
  form: {
    control: Control<EmployeeFormValues>;
  };
  readOnly: boolean;
}

export function PersonalInfoFields({ form, readOnly }: PersonalInfoFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter first name"
                  {...field}
                  readOnly={readOnly}
                  className={readOnly ? "bg-gray-50" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div>
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter last name"
                  {...field}
                  readOnly={readOnly}
                  className={readOnly ? "bg-gray-50" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <GenderField form={form} readOnly={readOnly} />

      <div className="md:col-span-3">
        <DateInputField
          control={form.control}
          name="date_of_birth"
          label="Date of Birth"
          required={false}
          readOnly={readOnly}
          maxDate={new Date()}
          minDate={new Date("1900-01-01")}
        />
      </div>
    </div>
  );
}


import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types/employee";
import { DateInputField } from "./DateInputField";

interface HireDateFieldProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
}

export const HireDateField = ({ form, readOnly }: HireDateFieldProps) => {
  return (
    <DateInputField
      control={form.control}
      name="hire_date"
      label="Hire Date"
      required={true}
      readOnly={readOnly}
    />
  );
};

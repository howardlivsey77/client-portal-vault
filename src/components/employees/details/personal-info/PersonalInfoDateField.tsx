
import { Control } from "react-hook-form";
import { DateInputField } from "../../DateInputField";
import { PersonalInfoFormValues } from "./types";

interface PersonalInfoDateFieldProps {
  control: Control<PersonalInfoFormValues>;
}

export const PersonalInfoDateField = ({ control }: PersonalInfoDateFieldProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DateInputField
        control={control}
        name="date_of_birth"
        label="Date of Birth"
        required={false}
        readOnly={false}
        maxDate={new Date()}
        minDate={new Date("1900-01-01")}
      />
      <DateInputField
        control={control}
        name="hire_date"
        label="Hire Date"
        required={true}
        readOnly={false}
      />
    </div>
  );
};

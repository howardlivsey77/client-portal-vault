
import { Control } from "react-hook-form";
import { DateInputField } from "../../DateInputField";
import { PersonalInfoFormValues } from "./types";

interface PersonalInfoDateFieldProps {
  control: Control<PersonalInfoFormValues>;
}

export const PersonalInfoDateField = ({ control }: PersonalInfoDateFieldProps) => {
  return (
    <div>
      <DateInputField
        control={control}
        name="date_of_birth"
        label="Date of Birth"
        required={false}
        readOnly={false}
        maxDate={new Date()}
        minDate={new Date("1900-01-01")}
      />
    </div>
  );
};

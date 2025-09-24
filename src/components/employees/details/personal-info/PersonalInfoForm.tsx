
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useImperativeHandle, forwardRef } from "react";
import { Form } from "@/components/ui/form";
import { personalInfoSchema } from "./PersonalInfoSchema";
import { PersonalInfoFormValues, PersonalInfoProps } from "./types";
import { PersonalInfoBasicFields } from "./PersonalInfoBasicFields";
import { PersonalInfoDateField } from "./PersonalInfoDateField";
import { PersonalInfoRateFields } from "./PersonalInfoRateFields";
import { PersonalInfoDisplay } from "./PersonalInfoDisplay";

interface PersonalInfoFormComponentProps extends PersonalInfoProps {
  isEditing: boolean;
  toggleEditMode: () => void;
  onSubmit: (data: PersonalInfoFormValues) => Promise<void>;
}

export interface PersonalInfoFormRef {
  submitForm: () => void;
  resetForm: () => void;
}

export const PersonalInfoFormComponent = forwardRef<PersonalInfoFormRef, PersonalInfoFormComponentProps>(({ 
  employee, 
  isEditing, 
  toggleEditMode, 
  onSubmit 
}, ref) => {
  // Setup form with default values based on employee data
  const getDefaultValues = () => ({
    first_name: employee.first_name,
    last_name: employee.last_name,
    department: employee.department,
    gender: employee.gender as "Male" | "Female" | "Other" | "Prefer not to say" | null,
    payroll_id: employee.payroll_id,
    date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth) : null,
    hire_date: employee.hire_date ? new Date(employee.hire_date) : new Date(),
    hours_per_week: employee.hours_per_week ?? 40,
    hourly_rate: employee.hourly_rate ?? 0,
    rate_2: employee.rate_2,
    rate_3: employee.rate_3,
    rate_4: employee.rate_4,
  });

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: getDefaultValues()
  });

  // Reset form values when employee data changes
  useEffect(() => {
    form.reset(getDefaultValues());
  }, [employee, form]);

  // Expose form methods to parent component
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      form.handleSubmit(onSubmit)();
    },
    resetForm: () => {
      form.reset(getDefaultValues());
    }
  }), [form, onSubmit]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isEditing ? (
          <>
            <PersonalInfoBasicFields control={form.control} />
            <PersonalInfoDateField control={form.control} />
            <PersonalInfoRateFields control={form.control} />
          </>
        ) : (
          <PersonalInfoDisplay employee={employee} />
        )}
        {/* Hidden submit button to enable form submission */}
        <button type="submit" className="hidden" />
      </form>
    </Form>
  );
});

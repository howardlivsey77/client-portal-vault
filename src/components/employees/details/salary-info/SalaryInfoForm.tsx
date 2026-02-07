
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useImperativeHandle, forwardRef } from "react";
import { Form } from "@/components/ui/form";
import { salaryInfoSchema } from "./SalaryInfoSchema";
import { SalaryInfoFormValues } from "./types";
import { SalaryInfoFields } from "./SalaryInfoFields";
import { SalaryInfoDisplay } from "./SalaryInfoDisplay";
import { Employee } from "@/types";

interface SalaryInfoFormComponentProps {
  employee: Employee;
  isEditing: boolean;
  toggleEditMode: () => void;
  onSubmit: (data: SalaryInfoFormValues) => Promise<void>;
}

export interface SalaryInfoFormRef {
  submitForm: () => void;
  resetForm: () => void;
}

export const SalaryInfoFormComponent = forwardRef<SalaryInfoFormRef, SalaryInfoFormComponentProps>(({ 
  employee, 
  isEditing, 
  toggleEditMode, 
  onSubmit 
}, ref) => {
  const getDefaultValues = () => ({
    hours_per_week: employee.hours_per_week ?? 40,
    hourly_rate: employee.hourly_rate ?? 0,
    rate_2: employee.rate_2,
    rate_3: employee.rate_3,
    rate_4: employee.rate_4,
  });

  const form = useForm<SalaryInfoFormValues>({
    resolver: zodResolver(salaryInfoSchema),
    defaultValues: getDefaultValues()
  });

  useEffect(() => {
    form.reset(getDefaultValues());
  }, [employee, form]);

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
          <SalaryInfoFields control={form.control} />
        ) : (
          <SalaryInfoDisplay employee={employee} />
        )}
        <button type="submit" className="hidden" />
      </form>
    </Form>
  );
});

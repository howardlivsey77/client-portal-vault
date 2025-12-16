import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { employeeSchema, EmployeeFormValues, defaultWorkPattern } from "@/types";
import { useCompany, useAuth } from "@/providers";
import { useNextPayrollId } from "./useNextPayrollId";
import { createEmployee } from "@/services/employees/employeeService";
import { toast } from "sonner";

export const WIZARD_STEPS = [
  {
    number: 1,
    title: "Personal Details",
    description: "Basic information & address",
    fields: ["first_name", "last_name", "email", "date_of_birth", "gender", "address1", "address2", "address3", "address4", "postcode"] as const,
  },
  {
    number: 2,
    title: "Employment",
    description: "Role & schedule",
    fields: ["department", "hire_date", "payroll_id", "status"] as const,
  },
  {
    number: 3,
    title: "Pay",
    description: "Compensation details",
    fields: ["hours_per_week", "hourly_rate", "monthly_salary"] as const,
  },
  {
    number: 4,
    title: "HMRC",
    description: "Tax & NI details",
    fields: ["national_insurance_number", "tax_code", "nic_code", "week_one_month_one", "student_loan_plan", "has_p45", "taxable_pay_ytd", "tax_paid_ytd", "p46_statement"] as const,
  },
  {
    number: 5,
    title: "Pension",
    description: "NHS Pension details",
    fields: ["nhs_pension_member", "previous_year_pensionable_pay", "nhs_pension_tier", "nhs_pension_employee_rate"] as const,
  },
];

// Validation schemas for each step
const step1Schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});

const step2Schema = z.object({
  department: z.string().min(1, "Department is required"),
});

const step3Schema = z.object({
  hours_per_week: z.coerce.number().min(0, "Hours must be 0 or more"),
  hourly_rate: z.coerce.number().min(0, "Hourly rate must be 0 or more"),
});

const step4Schema = z.object({});

const step5Schema = z.object({});

const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema];

export const useNewEmployeeWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { suggestedPayrollId } = useNextPayrollId(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      department: "",
      hours_per_week: 40,
      hourly_rate: 0,
      date_of_birth: null,
      hire_date: new Date(),
      email: "",
      address1: "",
      address2: "",
      address3: "",
      address4: "",
      postcode: "",
      work_pattern: JSON.stringify(defaultWorkPattern),
      tax_code: "",
      week_one_month_one: false,
      nic_code: "",
      student_loan_plan: null,
      has_p45: false,
      taxable_pay_ytd: null,
      tax_paid_ytd: null,
      p46_statement: null,
      nhs_pension_member: false,
      previous_year_pensionable_pay: null,
      nhs_pension_tier: null,
      nhs_pension_employee_rate: null,
      monthly_salary: null,
      status: "active",
      leave_date: null,
      payroll_id: "",
    },
  });

  // Set suggested payroll ID when available
  useState(() => {
    if (suggestedPayrollId && !form.getValues("payroll_id")) {
      form.setValue("payroll_id", suggestedPayrollId);
    }
  });

  const validateCurrentStep = useCallback(async () => {
    const schema = stepSchemas[currentStep - 1];
    const stepFields = WIZARD_STEPS[currentStep - 1].fields;
    const values = form.getValues();
    
    // Get only the fields for the current step
    const stepValues: Record<string, unknown> = {};
    stepFields.forEach((field) => {
      stepValues[field] = values[field as keyof EmployeeFormValues];
    });

    try {
      schema.parse(stepValues);
      
      // Trigger validation on the form fields for this step
      const fieldsToValidate = stepFields.filter(field => 
        ["first_name", "last_name", "department", "hours_per_week", "hourly_rate"].includes(field)
      );
      
      const results = await Promise.all(
        fieldsToValidate.map(field => form.trigger(field as keyof EmployeeFormValues))
      );
      
      return results.every(Boolean);
    } catch {
      // Trigger form validation to show errors
      const fieldsToValidate = stepFields.filter(field => 
        ["first_name", "last_name", "department", "hours_per_week", "hourly_rate"].includes(field)
      );
      
      await Promise.all(
        fieldsToValidate.map(field => form.trigger(field as keyof EmployeeFormValues))
      );
      
      return false;
    }
  }, [currentStep, form]);

  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      if (currentStep < WIZARD_STEPS.length) {
        setCurrentStep((prev) => prev + 1);
      }
    }
    return isValid;
  }, [currentStep, validateCurrentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  }, []);

  const submitForm = useCallback(async (onSuccess?: () => void) => {
    if (!currentCompany?.id) {
      toast.error("No company selected");
      return false;
    }

    if (!user?.id) {
      toast.error("User not authenticated");
      return false;
    }

    // Validate all steps
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Please fix validation errors before submitting");
      return false;
    }

    setIsSubmitting(true);
    try {
      const values = form.getValues();
      await createEmployee(values, user.id, currentCompany.id);
      toast.success("Employee created successfully!");
      onSuccess?.();
      return true;
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error("Failed to create employee");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentCompany?.id, user?.id, form]);

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    form.reset();
    if (suggestedPayrollId) {
      form.setValue("payroll_id", suggestedPayrollId);
    }
  }, [form, suggestedPayrollId]);

  return {
    form,
    currentStep,
    totalSteps: WIZARD_STEPS.length,
    steps: WIZARD_STEPS,
    isSubmitting,
    completedSteps,
    nextStep,
    prevStep,
    goToStep,
    submitForm,
    resetWizard,
    validateCurrentStep,
  };
};

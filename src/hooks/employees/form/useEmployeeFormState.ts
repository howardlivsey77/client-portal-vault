
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, EmployeeFormValues, defaultWorkPattern } from "@/types";

export const useEmployeeFormState = () => {
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      department: "",
      cost_centre: null,
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
      nhs_pension_member: false,
      previous_year_pensionable_pay: null,
      nhs_pension_tier: null,
      nhs_pension_employee_rate: null,
      monthly_salary: null,
      status: "active",
      leave_date: null,
    },
  });

  return {
    form,
    loading,
    setLoading,
    submitLoading,
    setSubmitLoading,
    readOnly,
    setReadOnly,
  };
};

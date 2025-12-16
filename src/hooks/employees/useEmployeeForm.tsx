import { useState, useEffect } from "react";
import {
  useEmployeeFormState,
  useEmployeeDataFetching,
  useEmployeeFormSubmission,
  UseEmployeeFormReturn
} from "./form";
import { useNextPayrollId } from "./useNextPayrollId";

export const useEmployeeForm = (employeeId?: string): UseEmployeeFormReturn => {
  const isEditMode = employeeId !== undefined && employeeId !== "new";
  
  const {
    form,
    loading,
    setLoading,
    submitLoading,
    setSubmitLoading,
    readOnly,
    setReadOnly,
  } = useEmployeeFormState();

  const { suggestedPayrollId } = useNextPayrollId(isEditMode);

  // Set initial loading state for edit mode
  useState(() => {
    if (isEditMode) {
      setLoading(true);
    }
  });

  const { fetchEmployeeData } = useEmployeeDataFetching(
    employeeId,
    isEditMode,
    form,
    setLoading
  );

  const { onSubmit } = useEmployeeFormSubmission(
    isEditMode,
    employeeId,
    setSubmitLoading
  );

  // Only fetch data when employeeId changes, not on every render
  useEffect(() => {
    if (isEditMode && employeeId) {
      fetchEmployeeData();
    }
  }, [isEditMode, employeeId]);

  // Auto-populate suggested payroll ID for new employees
  useEffect(() => {
    if (!isEditMode && suggestedPayrollId && !form.getValues("payroll_id")) {
      form.setValue("payroll_id", suggestedPayrollId);
    }
  }, [suggestedPayrollId, isEditMode, form]);

  return {
    form,
    loading,
    isEditMode,
    readOnly,
    submitLoading,
    setReadOnly,
    fetchEmployeeData,
    onSubmit
  };
};

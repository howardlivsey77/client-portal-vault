import { useState, useEffect } from "react";
import { useEmployeeFormState } from "./form/useEmployeeFormState";
import { useEmployeeDataFetching } from "./form/useEmployeeDataFetching";
import { useEmployeeFormSubmission } from "./form/useEmployeeFormSubmission";
import { UseEmployeeFormReturn } from "./form/types";

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
  }, [isEditMode, employeeId]); // Removed fetchEmployeeData from dependencies to prevent infinite loop

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

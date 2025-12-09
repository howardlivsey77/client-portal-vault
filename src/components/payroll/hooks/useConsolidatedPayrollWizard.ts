
import { useState, useCallback } from "react";
import { toast } from "@/hooks";
import { processExtraHoursFile, savePayrollData } from "@/services";
import { matchEmployees, applyUserMappings, EmployeeMatchingResults } from "@/services/payroll/employeeMatching";
import { useAuth } from "@/providers";
import { ExtraHoursSummary, PayrollFiles } from "../types";

type WizardStep = 0 | 1 | 2 | 3; // Upload -> Review -> Absences -> Final Summary

interface ConsolidatedWizardState {
  currentStep: WizardStep;
  uploadedFiles: PayrollFiles;
  processedData: ExtraHoursSummary | null;
  isProcessing: boolean;
  showEmployeeMapping: boolean;
  matchingResults: EmployeeMatchingResults | null;
  error: string | null;
}

export function useConsolidatedPayrollWizard() {
  const { user } = useAuth();
  
  const [state, setState] = useState<ConsolidatedWizardState>({
    currentStep: 0,
    uploadedFiles: { extraHours: null, absences: null },
    processedData: null,
    isProcessing: false,
    showEmployeeMapping: false,
    matchingResults: null,
    error: null,
  });

  // Consolidated file upload handler
  const handleFileUpload = useCallback((stepId: keyof PayrollFiles, file: File | null) => {
    setState(prev => ({
      ...prev,
      uploadedFiles: { ...prev.uploadedFiles, [stepId]: file },
      processedData: stepId === 'extraHours' ? null : prev.processedData,
      error: null,
    }));
  }, []);

  // Consolidated file processing
  const processExtraHours = useCallback(async (file: File): Promise<ExtraHoursSummary> => {
    if (state.processedData) {
      return state.processedData;
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const result = await processExtraHoursFile(file);
      
      // Perform employee matching immediately
      const matching = await matchEmployees(result.employeeDetails);
      const needsMapping = matching.fuzzyMatches.length > 0 || matching.unmatchedEmployees.length > 0;
      
      setState(prev => ({
        ...prev,
        processedData: result,
        matchingResults: matching,
        showEmployeeMapping: needsMapping,
        isProcessing: false,
      }));
      
      return result;
    } catch (error) {
      console.error("Error processing file:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process file";
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Error processing file",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [state.processedData]);

  // Handle employee mapping confirmation
  const handleEmployeeMappingConfirm = useCallback((userMappings: Record<string, string>) => {
    if (!state.matchingResults || !state.processedData) return;
    
    console.log("User mappings confirmed:", userMappings);
    
    // Apply user mappings to get final employee data
    const finalEmployeeData = applyUserMappings(state.matchingResults, userMappings);
    
    // Update processed data with mapped employee information
    const updatedProcessedData = {
      ...state.processedData,
      employeeDetails: finalEmployeeData,
      employeeCount: finalEmployeeData.length
    };
    
    setState(prev => ({
      ...prev,
      processedData: updatedProcessedData,
      showEmployeeMapping: false,
      currentStep: 2, // Advance to Upload Absences step
    }));
    
    toast({
      title: "Employee mapping completed",
      description: `${finalEmployeeData.length} employees successfully mapped.`,
    });
  }, [state.matchingResults, state.processedData]);

  // Handle employee mapping cancellation
  const handleEmployeeMappingCancel = useCallback(() => {
    setState(prev => ({ ...prev, showEmployeeMapping: false }));
    
    toast({
      title: "Employee mapping cancelled",
      description: "Returning to previous step.",
      variant: "destructive",
    });
  }, []);

  // Navigate to next step
  const handleNext = useCallback(async (onOpenChange: (open: boolean) => void) => {
    console.log("HandleNext called - Current step:", state.currentStep);
    
    // Check if we need to show employee mapping after summary step
    if (state.currentStep === 1 && !state.showEmployeeMapping && state.matchingResults) {
      const needsMapping = state.matchingResults.fuzzyMatches.length > 0 || state.matchingResults.unmatchedEmployees.length > 0;
      if (needsMapping) {
        console.log("Showing employee mapping dialog");
        setState(prev => ({ ...prev, showEmployeeMapping: true }));
        return; // Don't advance step yet - mapping completion will advance to step 2
      }
    }
    
    const totalSteps = 4;
    
    if (state.currentStep < totalSteps - 1) {
      console.log("Advancing to step:", state.currentStep + 1);
      setState(prev => ({ ...prev, currentStep: (prev.currentStep + 1) as WizardStep }));
    } else {
      // Process all data and finish the wizard
      if (state.processedData && user) {
        try {
          setState(prev => ({ ...prev, isProcessing: true }));
          
          const saveResult = await savePayrollData(state.processedData, user.id);
          
          if (saveResult.success) {
            toast({
              title: "Payroll input completed",
              description: "Your payroll data has been processed and saved successfully.",
            });
          } else {
            toast({
              title: "Warning",
              description: saveResult.message || "Payroll data was processed but couldn't be saved to the database.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error saving payroll data:", error);
          toast({
            title: "Error saving data",
            description: "There was a problem saving your payroll data.",
            variant: "destructive",
          });
        } finally {
          setState(prev => ({ ...prev, isProcessing: false }));
        }
      } else {
        toast({
          title: "Payroll input completed",
          description: "Your payroll data has been processed successfully.",
        });
      }
      onOpenChange(false);
    }
  }, [state.currentStep, state.showEmployeeMapping, state.matchingResults, state.processedData, user]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (state.showEmployeeMapping) {
      handleEmployeeMappingCancel();
      return;
    }
    
    if (state.currentStep > 0) {
      console.log("Going back to step:", state.currentStep - 1);
      setState(prev => ({ ...prev, currentStep: (prev.currentStep - 1) as WizardStep }));
    }
  }, [state.currentStep, state.showEmployeeMapping, handleEmployeeMappingCancel]);

  // Check if can proceed to next step
  const canProceed = useCallback(() => {
    if (state.showEmployeeMapping) {
      return false; // User must complete mapping first
    }
    
    if (state.currentStep === 0) {
      return state.uploadedFiles.extraHours !== null;
    } else if (state.currentStep === 1) {
      return state.processedData !== null;
    } else if (state.currentStep === 2) {
      return true; // Absences file is optional
    } else if (state.currentStep === 3) {
      return state.processedData !== null; // Final summary requires processed data
    }
    return true;
  }, [state.currentStep, state.uploadedFiles.extraHours, state.processedData, state.showEmployeeMapping]);

  // Reset wizard state
  const resetWizard = useCallback(() => {
    setState({
      currentStep: 0,
      uploadedFiles: { extraHours: null, absences: null },
      processedData: null,
      isProcessing: false,
      showEmployeeMapping: false,
      matchingResults: null,
      error: null,
    });
  }, []);

  return {
    // State
    currentStep: state.currentStep,
    uploadedFiles: state.uploadedFiles,
    processedData: state.processedData,
    isProcessing: state.isProcessing,
    showEmployeeMapping: state.showEmployeeMapping,
    matchingResults: state.matchingResults,
    error: state.error,
    
    // Actions
    handleFileUpload,
    processExtraHours,
    handleNext,
    handleBack,
    handleEmployeeMappingConfirm,
    handleEmployeeMappingCancel,
    canProceed,
    resetWizard,
  };
}

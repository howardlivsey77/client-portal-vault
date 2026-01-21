
import { useState, useCallback } from "react";
import { toast } from "@/hooks";
import { processExtraHoursFile, savePayrollData } from "@/services";
import { matchEmployees, applyUserMappings, EmployeeMatchingResults } from "@/services/payroll/employeeMatching";
import { saveAliases } from "@/services/payroll/employeeNameAliases";
import { useAuth } from "@/providers";
import { useCompany } from "@/providers/CompanyProvider";
import { ExtraHoursSummary, PayrollFiles } from "../types";
import { ImportFormat } from "../FormatSelector";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";

type WizardStep = 0 | 1 | 2 | 3 | 4; // Format Select -> Upload -> Review -> Absences -> Final Summary

interface ConsolidatedWizardState {
  currentStep: WizardStep;
  selectedFormat: ImportFormat;
  uploadedFiles: PayrollFiles;
  processedData: ExtraHoursSummary | null;
  isProcessing: boolean;
  showEmployeeMapping: boolean;
  matchingResults: EmployeeMatchingResults | null;
  mappingCompleted: boolean;
  error: string | null;
}

export function useConsolidatedPayrollWizard(payPeriod?: PayPeriod, financialYear?: number) {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [state, setState] = useState<ConsolidatedWizardState>({
    currentStep: 0,
    selectedFormat: 'practice-index',
    uploadedFiles: { extraHours: null, absences: null },
    processedData: null,
    isProcessing: false,
    showEmployeeMapping: false,
    matchingResults: null,
    mappingCompleted: false,
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

  // Format change handler
  const handleFormatChange = useCallback((format: ImportFormat) => {
    setState(prev => ({
      ...prev,
      selectedFormat: format,
      // Reset processed data when format changes
      processedData: null,
      matchingResults: null,
    }));
  }, []);

  // Consolidated file processing
  const processExtraHours = useCallback(async (file: File): Promise<ExtraHoursSummary> => {
    if (state.processedData) {
      return state.processedData;
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Pass the selected format and company ID to the parser for rate config loading
      const result = await processExtraHoursFile(file, state.selectedFormat, currentCompany?.id);
      
      // Perform employee matching immediately - pass company ID to check for saved aliases
      const matching = await matchEmployees(result.employeeDetails, currentCompany?.id);
      const needsMapping = matching.fuzzyMatches.length > 0 || matching.unmatchedEmployees.length > 0;
      
      // Show info about alias matches
      if (matching.aliasMatchCount > 0) {
        toast({
          title: "Saved mappings applied",
          description: `${matching.aliasMatchCount} employee${matching.aliasMatchCount !== 1 ? 's' : ''} matched using saved aliases.`,
        });
      }
      
      // If no mapping needed, apply rates immediately for exact matches
      let finalResult = result;
      if (!needsMapping) {
        const enrichedEmployeeData = applyUserMappings(matching, {});
        finalResult = {
          ...result,
          employeeDetails: enrichedEmployeeData,
          employeeCount: enrichedEmployeeData.length,
        };
      }
      
      setState(prev => ({
        ...prev,
        processedData: finalResult,
        matchingResults: matching,
        showEmployeeMapping: false, // Don't auto-show - wait for user to click Next on step 2
        mappingCompleted: !needsMapping, // Mark as completed if no mapping needed
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
  }, [state.processedData, state.selectedFormat, currentCompany?.id]);

  // Handle employee mapping confirmation
  const handleEmployeeMappingConfirm = useCallback(async (
    userMappings: Record<string, string>,
    rememberMappings: Record<string, boolean>
  ) => {
    if (!state.matchingResults || !state.processedData) return;
    
    console.log("User mappings confirmed:", userMappings);
    console.log("Remember mappings:", rememberMappings);
    
    // Save aliases for mappings that should be remembered
    if (currentCompany?.id) {
      const aliasesToSave = Object.entries(userMappings)
        .filter(([sourceName, _]) => rememberMappings[sourceName] !== false)
        .map(([sourceName, employeeId]) => ({ sourceName, employeeId }));
      
      if (aliasesToSave.length > 0) {
        const result = await saveAliases(currentCompany.id, aliasesToSave);
        if (result.saved > 0) {
          console.log(`Saved ${result.saved} employee name aliases for future imports`);
          toast({
            title: "Mappings saved",
            description: `${result.saved} mapping${result.saved !== 1 ? 's' : ''} will be remembered for future imports.`,
          });
        }
      }
    }
    
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
      mappingCompleted: true, // Mark mapping as done - stay on step 2 to review summary
    }));
    
    toast({
      title: "Employee mapping completed",
      description: `${finalEmployeeData.length} employees successfully mapped.`,
    });
  }, [state.matchingResults, state.processedData, currentCompany?.id]);

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
    
    // Check if we need to show employee mapping after summary step (step 2)
    // Only show mapping dialog if mapping hasn't been completed yet
    if (state.currentStep === 2 && !state.showEmployeeMapping && state.matchingResults && !state.mappingCompleted) {
      const needsMapping = state.matchingResults.fuzzyMatches.length > 0 || state.matchingResults.unmatchedEmployees.length > 0;
      if (needsMapping) {
        console.log("Showing employee mapping dialog");
        setState(prev => ({ ...prev, showEmployeeMapping: true }));
        return; // Don't advance step yet - user will review summary after mapping
      }
    }
    
    const totalSteps = 5; // Format -> Upload -> Review -> Absences -> Final Summary
    
    if (state.currentStep < totalSteps - 1) {
      console.log("Advancing to step:", state.currentStep + 1);
      setState(prev => ({ ...prev, currentStep: (prev.currentStep + 1) as WizardStep }));
    } else {
      // Process all data and finish the wizard
      if (state.processedData && user) {
        try {
          setState(prev => ({ ...prev, isProcessing: true }));
          // Save with company ID and selected pay period
          const saveResult = await savePayrollData(
            state.processedData, 
            user.id, 
            currentCompany?.id,
            payPeriod ? { periodNumber: payPeriod.periodNumber, year: financialYear || payPeriod.year } : undefined
          );
          
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
    
    // Step 0: Format selection - always can proceed
    if (state.currentStep === 0) {
      return true;
    }
    // Step 1: Upload file
    else if (state.currentStep === 1) {
      return state.uploadedFiles.extraHours !== null;
    }
    // Step 2: Review summary
    else if (state.currentStep === 2) {
      return state.processedData !== null;
    }
    // Step 3: Absences (optional)
    else if (state.currentStep === 3) {
      return true;
    }
    // Step 4: Final summary
    else if (state.currentStep === 4) {
      return state.processedData !== null;
    }
    return true;
  }, [state.currentStep, state.uploadedFiles.extraHours, state.processedData, state.showEmployeeMapping]);

  // Reset wizard state
  const resetWizard = useCallback(() => {
    setState({
      currentStep: 0,
      selectedFormat: 'practice-index',
      uploadedFiles: { extraHours: null, absences: null },
      processedData: null,
      isProcessing: false,
      showEmployeeMapping: false,
      matchingResults: null,
      mappingCompleted: false,
      error: null,
    });
  }, []);

  return {
    // State
    currentStep: state.currentStep,
    selectedFormat: state.selectedFormat,
    uploadedFiles: state.uploadedFiles,
    processedData: state.processedData,
    isProcessing: state.isProcessing,
    showEmployeeMapping: state.showEmployeeMapping,
    matchingResults: state.matchingResults,
    error: state.error,
    
    // Actions
    handleFileUpload,
    handleFormatChange,
    processExtraHours,
    handleNext,
    handleBack,
    handleEmployeeMappingConfirm,
    handleEmployeeMappingCancel,
    canProceed,
    resetWizard,
  };
}

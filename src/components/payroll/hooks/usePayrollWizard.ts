
import { useFileProcessing } from "./useFileProcessing";
import { useEmployeeMatching } from "./useEmployeeMatching";
import { useWizardNavigation } from "./useWizardNavigation";

export function usePayrollWizard() {
  const {
    uploadedFiles,
    processedData,
    isProcessing,
    handleFileUpload,
    processExtraHours,
    resetFileProcessing,
  } = useFileProcessing();

  const {
    matchingResults,
    showEmployeeMapping,
    performEmployeeMatching,
    handleEmployeeMappingConfirm: originalHandleEmployeeMappingConfirm,
    handleEmployeeMappingCancel,
    showMappingDialog,
    resetMatching,
  } = useEmployeeMatching();

  const {
    currentStep,
    handleNext: originalHandleNext,
    handleBack: originalHandleBack,
    canProceed: originalCanProceed,
    advanceToStep,
  } = useWizardNavigation();

  // Enhanced file processing that includes employee matching
  const getExtraHoursSummary = async (file: File) => {
    const result = await processExtraHours(file);
    const needsMapping = await performEmployeeMatching(result);
    return result;
  };

  // Wrapper for employee mapping confirmation that advances to next step
  const handleEmployeeMappingConfirm = (userMappings: Record<string, string>) => {
    if (!processedData) return;
    
    const updatedData = originalHandleEmployeeMappingConfirm(userMappings, processedData);
    if (updatedData) {
      // Advance to the Upload Absences step (step 2)
      console.log("Advancing to Upload Absences step (step 2)");
      advanceToStep(2);
    }
  };

  // Wrapper for handleNext that includes mapping logic
  const handleNext = async (onOpenChange: (open: boolean) => void) => {
    let needsMapping = false;
    
    if (currentStep === 1 && matchingResults) {
      needsMapping = matchingResults.fuzzyMatches.length > 0 || matchingResults.unmatchedEmployees.length > 0;
    }
    
    await originalHandleNext(onOpenChange, processedData, needsMapping, showMappingDialog);
  };

  // Wrapper for handleBack
  const handleBack = () => {
    originalHandleBack(showEmployeeMapping, handleEmployeeMappingCancel);
  };

  // Wrapper for canProceed
  const canProceed = () => {
    return originalCanProceed(uploadedFiles, processedData, showEmployeeMapping);
  };

  // Reset all state when starting over
  const resetWizard = () => {
    resetFileProcessing();
    resetMatching();
    advanceToStep(0);
  };

  return {
    currentStep,
    uploadedFiles,
    isProcessing,
    showEmployeeMapping,
    matchingResults,
    handleFileUpload,
    getExtraHoursSummary,
    handleNext,
    handleBack,
    handleEmployeeMappingConfirm,
    handleEmployeeMappingCancel,
    canProceed,
    resetWizard,
  };
}

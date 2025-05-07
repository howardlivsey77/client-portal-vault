
import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { processExtraHoursFile } from "@/services/payroll";
import { ExtraHoursSummary, PayrollFiles } from "../types";

export function usePayrollWizard() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploadedFiles, setUploadedFiles] = useState<PayrollFiles>({
    extraHours: null,
    absences: null,
  });
  
  // Keep track of processed data
  const [processedData, setProcessedData] = useState<ExtraHoursSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (stepId: keyof PayrollFiles, file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [stepId]: file
    }));
    
    // Reset processed data when a new file is uploaded
    if (stepId === 'extraHours') {
      setProcessedData(null);
    }
  };

  // Process the extra hours file and get summary data
  const getExtraHoursSummary = useCallback(async (file: File): Promise<ExtraHoursSummary> => {
    console.log("Processing file:", file.name);
    
    if (processedData) {
      return processedData;
    }
    
    try {
      setIsProcessing(true);
      const result = await processExtraHoursFile(file);
      setProcessedData(result);
      return result;
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error processing file",
        description: "There was a problem processing your file. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [processedData]);

  const handleNext = (onOpenChange: (open: boolean) => void) => {
    if (currentStep < 2) { // Hardcoded length to avoid circular dependency
      setCurrentStep(currentStep + 1);
    } else {
      // Process all data and finish the wizard
      toast({
        title: "Payroll input completed",
        description: "Your payroll data has been processed successfully.",
      });
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return uploadedFiles.extraHours !== null;
    } else if (currentStep === 1) {
      // Allow proceeding from the summary step if data is processed or processing
      return true;
    } else if (currentStep === 2) {
      return uploadedFiles.absences !== null;
    }
    return true;
  };

  return {
    currentStep,
    uploadedFiles,
    isProcessing,
    handleFileUpload,
    getExtraHoursSummary,
    handleNext,
    handleBack,
    canProceed,
  };
}

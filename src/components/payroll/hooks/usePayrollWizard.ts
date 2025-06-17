
import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { processExtraHoursFile, savePayrollData } from "@/services/payroll";
import { ExtraHoursSummary, PayrollFiles } from "../types";
import { matchEmployees, applyUserMappings, EmployeeMatchingResults } from "@/services/payroll/employeeMatching";
import { useAuth } from "@/providers/AuthProvider";

// Create a simple store for sharing data between components
// In a real app, you might use a more robust state management solution
let globalProcessedData: ExtraHoursSummary | null = null;

export const getProcessedPayrollData = (): ExtraHoursSummary | null => {
  return globalProcessedData;
};

export const setProcessedPayrollData = (data: ExtraHoursSummary | null): void => {
  globalProcessedData = data;
};

export function usePayrollWizard() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploadedFiles, setUploadedFiles] = useState<PayrollFiles>({
    extraHours: null,
    absences: null,
  });
  
  // Keep track of processed data
  const [processedData, setProcessedData] = useState<ExtraHoursSummary | null>(null);
  const [matchingResults, setMatchingResults] = useState<EmployeeMatchingResults | null>(null);
  const [showEmployeeMapping, setShowEmployeeMapping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handleFileUpload = (stepId: keyof PayrollFiles, file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [stepId]: file
    }));
    
    // Reset processed data when a new file is uploaded
    if (stepId === 'extraHours') {
      setProcessedData(null);
      setProcessedPayrollData(null);
      setMatchingResults(null);
      setShowEmployeeMapping(false);
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
      
      // Perform employee matching
      const matching = await matchEmployees(result.employeeDetails);
      setMatchingResults(matching);
      
      // Check if we need to show employee mapping dialog
      const needsMapping = matching.fuzzyMatches.length > 0 || matching.unmatchedEmployees.length > 0;
      if (needsMapping) {
        console.log("Employee mapping required:", {
          fuzzy: matching.fuzzyMatches.length,
          unmatched: matching.unmatchedEmployees.length
        });
      }
      
      // Store in global state for sharing with reports
      setProcessedPayrollData(result);
      
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

  const handleEmployeeMappingConfirm = (userMappings: Record<string, string>) => {
    if (!matchingResults || !processedData) return;
    
    console.log("User mappings confirmed:", userMappings);
    
    // Apply user mappings to get final employee data
    const finalEmployeeData = applyUserMappings(matchingResults, userMappings);
    
    // Update processed data with mapped employee information
    const updatedProcessedData = {
      ...processedData,
      employeeDetails: finalEmployeeData,
      employeeCount: finalEmployeeData.length
    };
    
    setProcessedData(updatedProcessedData);
    setProcessedPayrollData(updatedProcessedData);
    setShowEmployeeMapping(false);
    
    toast({
      title: "Employee mapping completed",
      description: `${finalEmployeeData.length} employees successfully mapped.`,
    });
    
    // Advance to next step
    setCurrentStep(currentStep + 1);
  };

  const handleEmployeeMappingCancel = () => {
    setShowEmployeeMapping(false);
    toast({
      title: "Employee mapping cancelled",
      description: "Returning to previous step.",
      variant: "destructive",
    });
  };

  const handleNext = async (onOpenChange: (open: boolean) => void) => {
    // Check if we need to show employee mapping after summary step
    if (currentStep === 1 && matchingResults) {
      const needsMapping = matchingResults.fuzzyMatches.length > 0 || matchingResults.unmatchedEmployees.length > 0;
      if (needsMapping) {
        setShowEmployeeMapping(true);
        return; // Don't advance step yet
      }
    }
    
    const totalSteps = showEmployeeMapping ? 4 : 3; // Include mapping step if needed
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Process all data and finish the wizard
      if (processedData && user) {
        setIsProcessing(true);
        try {
          // Save data to Supabase
          const saveResult = await savePayrollData(processedData, user.id);
          
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
          setIsProcessing(false);
        }
      } else {
        toast({
          title: "Payroll input completed",
          description: "Your payroll data has been processed successfully.",
        });
      }
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (showEmployeeMapping) {
      setShowEmployeeMapping(false);
      return;
    }
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (showEmployeeMapping) {
      return false; // User must complete mapping first
    }
    
    if (currentStep === 0) {
      return uploadedFiles.extraHours !== null;
    } else if (currentStep === 1) {
      // Allow proceeding from the summary step if data is processed
      return processedData !== null;
    } else if (currentStep === 2) {
      return uploadedFiles.absences !== null;
    }
    return true;
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
  };
}

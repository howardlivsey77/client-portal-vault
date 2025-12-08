
import { useState } from "react";
import { toast } from "@/hooks";
import { savePayrollData } from "@/services";
import { useAuth } from "@/providers/AuthProvider";
import { ExtraHoursSummary, PayrollFiles } from "../types";

export function useWizardNavigation() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const { user } = useAuth();

  const handleNext = async (
    onOpenChange: (open: boolean) => void,
    processedData: ExtraHoursSummary | null,
    needsMapping: boolean,
    showMappingDialog: () => void
  ) => {
    console.log("HandleNext called - Current step:", currentStep);
    
    // Check if we need to show employee mapping after summary step
    if (currentStep === 1 && needsMapping) {
      console.log("Showing employee mapping dialog");
      showMappingDialog();
      return; // Don't advance step yet - mapping completion will advance to step 2
    }
    
    // Total steps: Upload Extra Hours (0), Review Summary (1), Upload Absences (2)
    const totalSteps = 3;
    
    if (currentStep < totalSteps - 1) {
      console.log("Advancing to step:", currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      // Process all data and finish the wizard
      if (processedData && user) {
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

  const handleBack = (showEmployeeMapping: boolean, handleEmployeeMappingCancel: () => void) => {
    if (showEmployeeMapping) {
      handleEmployeeMappingCancel();
      return;
    }
    
    if (currentStep > 0) {
      console.log("Going back to step:", currentStep - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = (uploadedFiles: PayrollFiles, processedData: ExtraHoursSummary | null, showEmployeeMapping: boolean) => {
    if (showEmployeeMapping) {
      return false; // User must complete mapping first
    }
    
    if (currentStep === 0) {
      return uploadedFiles.extraHours !== null;
    } else if (currentStep === 1) {
      // Allow proceeding from the summary step if data is processed
      return processedData !== null;
    } else if (currentStep === 2) {
      // Absences file is optional, so always allow proceeding
      return true;
    }
    return true;
  };

  const advanceToStep = (stepNumber: number) => {
    console.log("Advancing to step:", stepNumber);
    setCurrentStep(stepNumber);
  };

  return {
    currentStep,
    handleNext,
    handleBack,
    canProceed,
    advanceToStep,
  };
}

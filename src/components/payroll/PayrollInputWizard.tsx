import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { usePayrollWizard } from "./hooks/usePayrollWizard";
import { WizardNavigation } from "./WizardNavigation";
import { createWizardSteps } from "./WizardSteps";
import { EmployeeMappingDialog } from "./EmployeeMappingDialog";

export { type EmployeeHoursData, type ExtraHoursSummary } from "./types";

interface PayrollInputWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayrollInputWizard({ open, onOpenChange }: PayrollInputWizardProps) {
  const {
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
    canProceed
  } = usePayrollWizard();
  
  const steps = createWizardSteps({
    uploadedFiles,
    handleFileUpload,
    getSummary: getExtraHoursSummary,
    isProcessing,
    showEmployeeMapping,
    matchingResults,
    onEmployeeMappingConfirm: handleEmployeeMappingConfirm,
    onEmployeeMappingCancel: handleEmployeeMappingCancel
  });
  
  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{currentStepData.title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {showEmployeeMapping && matchingResults ? (
            <EmployeeMappingDialog
              open={showEmployeeMapping}
              onOpenChange={() => {}}
              matchingResults={matchingResults}
              onConfirm={handleEmployeeMappingConfirm}
              onCancel={handleEmployeeMappingCancel}
            />
          ) : (
            currentStepData.component
          )}
        </div>

        {!showEmployeeMapping && (
          <DialogFooter>
            <WizardNavigation 
              currentStep={currentStep}
              totalSteps={steps.length}
              canProceed={canProceed()}
              isProcessing={isProcessing}
              onBack={handleBack}
              onNext={() => handleNext(onOpenChange)}
            />
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

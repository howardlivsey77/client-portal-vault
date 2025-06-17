
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Render employee mapping directly in the dialog when active
  if (showEmployeeMapping && matchingResults) {
    return (
      <EmployeeMappingDialog
        open={open}
        onOpenChange={onOpenChange}
        matchingResults={matchingResults}
        onConfirm={handleEmployeeMappingConfirm}
        onCancel={handleEmployeeMappingCancel}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{currentStepData.title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 py-4">
          <div className="pr-4">
            {currentStepData.component}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <WizardNavigation 
            currentStep={currentStep}
            totalSteps={steps.length}
            canProceed={canProceed()}
            isProcessing={isProcessing}
            onBack={handleBack}
            onNext={() => handleNext(onOpenChange)}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

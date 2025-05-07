
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
    handleFileUpload,
    getExtraHoursSummary,
    handleNext,
    handleBack,
    canProceed
  } = usePayrollWizard();
  
  const steps = createWizardSteps({
    uploadedFiles,
    handleFileUpload,
    getSummary: getExtraHoursSummary,
    isProcessing
  });
  
  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{currentStepData.title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {currentStepData.component}
        </div>

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
      </DialogContent>
    </Dialog>
  );
}

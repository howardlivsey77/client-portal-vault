
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConsolidatedPayrollWizard } from "./hooks/useConsolidatedPayrollWizard";
import { WizardNavigation } from "./WizardNavigation";
import { createWizardSteps } from "./WizardSteps";
import { EmployeeMappingDialog } from "./EmployeeMappingDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export { type EmployeeHoursData, type ExtraHoursSummary } from "./types";

interface PayrollInputWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayrollInputWizard({ open, onOpenChange }: PayrollInputWizardProps) {
  const {
    currentStep,
    uploadedFiles,
    processedData,
    isProcessing,
    showEmployeeMapping,
    matchingResults,
    error,
    handleFileUpload,
    processExtraHours,
    handleNext,
    handleBack,
    handleEmployeeMappingConfirm,
    handleEmployeeMappingCancel,
    canProceed
  } = useConsolidatedPayrollWizard();
  
  const steps = createWizardSteps({
    uploadedFiles,
    handleFileUpload,
    getSummary: processExtraHours,
    isProcessing,
    processedData,
    showEmployeeMapping,
    matchingResults,
    onEmployeeMappingConfirm: handleEmployeeMappingConfirm,
    onEmployeeMappingCancel: handleEmployeeMappingCancel
  });
  
  const currentStepData = steps[currentStep];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentStepData.title}</DialogTitle>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive" className="mx-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
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

      {/* Render employee mapping as a separate overlay dialog */}
      {showEmployeeMapping && matchingResults && (
        <EmployeeMappingDialog
          open={showEmployeeMapping}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              handleEmployeeMappingCancel();
            }
          }}
          matchingResults={matchingResults}
          onConfirm={handleEmployeeMappingConfirm}
          onCancel={handleEmployeeMappingCancel}
        />
      )}
    </>
  );
}

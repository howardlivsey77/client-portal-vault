
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

import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";

export { type EmployeeHoursData, type ExtraHoursSummary } from "./types";

interface PayrollInputWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payPeriod?: PayPeriod;
  financialYear?: number;
}

export function PayrollInputWizard({ open, onOpenChange, payPeriod, financialYear }: PayrollInputWizardProps) {
  const {
    currentStep,
    selectedFormat,
    uploadedFiles,
    processedData,
    isProcessing,
    showEmployeeMapping,
    matchingResults,
    error,
    handleFileUpload,
    handleFormatChange,
    processExtraHours,
    handleNext,
    handleBack,
    handleEmployeeMappingConfirm,
    handleEmployeeMappingCancel,
    canProceed
  } = useConsolidatedPayrollWizard(payPeriod, financialYear);
  
  const steps = createWizardSteps({
    uploadedFiles,
    handleFileUpload,
    getSummary: processExtraHours,
    isProcessing,
    processedData,
    showEmployeeMapping,
    matchingResults,
    onEmployeeMappingConfirm: handleEmployeeMappingConfirm,
    onEmployeeMappingCancel: handleEmployeeMappingCancel,
    selectedFormat,
    onFormatChange: handleFormatChange
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

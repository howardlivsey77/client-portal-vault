
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isProcessing: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  canProceed,
  isProcessing,
  onBack,
  onNext
}: WizardNavigationProps) {
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  
  return (
    <div className="flex sm:justify-between">
      <div className="flex items-center text-sm text-muted-foreground">
        Step {currentStep + 1} of {totalSteps}
      </div>
      <div className="flex gap-2">
        {!isFirstStep && (
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}
        <Button onClick={onNext} disabled={!canProceed || isProcessing}>
          {isLastStep ? "Finish" : "Next"}
          {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

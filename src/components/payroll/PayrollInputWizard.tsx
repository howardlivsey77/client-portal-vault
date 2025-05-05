
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { FileUploader } from "./FileUploader";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Step = {
  title: string;
  component: React.ReactNode;
};

export function PayrollInputWizard({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({
    extraHours: null,
  });

  const handleFileUpload = (stepId: string, file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [stepId]: file
    }));
  };

  const steps: Step[] = [
    {
      title: "Extra Hours Upload",
      component: (
        <FileUploader 
          onFileChange={(file) => handleFileUpload("extraHours", file)} 
          acceptedFileTypes=".xlsx,.xls,.csv"
          uploadedFile={uploadedFiles.extraHours}
          description="Upload your extra hours file to begin the payroll process"
        />
      ),
    },
    // Additional steps can be added here as needed
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const currentStepData = steps[currentStep];
  const canProceed = uploadedFiles.extraHours !== null || currentStep > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{currentStepData.title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {currentStepData.component}
        </div>

        <DialogFooter className="flex sm:justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            <Button onClick={handleNext} disabled={!canProceed}>
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

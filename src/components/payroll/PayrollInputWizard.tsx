import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { FileUploader } from "./FileUploader";
import { UploadSummary } from "./UploadSummary";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { processExtraHoursFile } from "@/services/payrollService";

type Step = {
  title: string;
  component: React.ReactNode;
};

export type EmployeeHoursData = {
  employeeId: string;
  employeeName: string;
  extraHours: number;
  entries: number;
  rateType?: string;
  rateValue?: number;
};

export type ExtraHoursSummary = {
  totalEntries: number;
  totalExtraHours: number;
  dateRange: {
    from: string;
    to: string;
  };
  employeeCount: number;
  employeeDetails: EmployeeHoursData[];
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
    absences: null,
  });
  
  // Keep track of processed data
  const [processedData, setProcessedData] = useState<ExtraHoursSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (stepId: string, file: File | null) => {
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
    {
      title: "Extra Hours Summary",
      component: (
        <UploadSummary
          file={uploadedFiles.extraHours}
          type="extraHours"
          getSummary={getExtraHoursSummary}
          isProcessing={isProcessing}
        />
      ),
    },
    {
      title: "Absences Upload",
      component: (
        <FileUploader 
          onFileChange={(file) => handleFileUpload("absences", file)} 
          acceptedFileTypes=".xlsx,.xls,.csv"
          uploadedFile={uploadedFiles.absences}
          description="Upload your employee absences file (sick leave, holidays, etc.)"
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
  
  // Determine if the user can proceed based on the current step
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
            <Button onClick={handleNext} disabled={!canProceed() || isProcessing}>
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

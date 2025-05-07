
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
import { UploadSummary } from "./UploadSummary";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Step = {
  title: string;
  component: React.ReactNode;
};

type EmployeeHoursData = {
  employeeId: string;
  employeeName: string;
  extraHours: number;
  entries: number;
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

  const handleFileUpload = (stepId: string, file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [stepId]: file
    }));
  };

  // Mock function to simulate file parsing for summary display
  const getExtraHoursSummary = (file: File) => {
    // Generate mock employee data for demonstration
    const mockEmployees = [
      { employeeId: "EMP001", employeeName: "John Smith", extraHours: 12.5, entries: 5 },
      { employeeId: "EMP002", employeeName: "Sarah Johnson", extraHours: 8.0, entries: 3 },
      { employeeId: "EMP003", employeeName: "Michael Brown", extraHours: 16.75, entries: 7 },
      { employeeId: "EMP004", employeeName: "Emma Davis", extraHours: 4.0, entries: 2 },
      { employeeId: "EMP005", employeeName: "Robert Wilson", extraHours: 9.5, entries: 4 }
    ];
    
    // Calculate totals from the mock data
    const totalExtraHours = Number(mockEmployees.reduce((sum, emp) => sum + emp.extraHours, 0).toFixed(2));
    const totalEntries = mockEmployees.reduce((sum, emp) => sum + emp.entries, 0);
    
    return {
      totalEntries: totalEntries,
      totalExtraHours: totalExtraHours,
      dateRange: {
        from: new Date(2023, 4, 1).toLocaleDateString(),
        to: new Date(2023, 4, 30).toLocaleDateString()
      },
      employeeCount: mockEmployees.length,
      employeeDetails: mockEmployees
    };
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
    {
      title: "Extra Hours Summary",
      component: (
        <UploadSummary
          file={uploadedFiles.extraHours}
          type="extraHours"
          getSummary={getExtraHoursSummary}
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
      // Always allow proceeding from the summary step
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
            <Button onClick={handleNext} disabled={!canProceed()}>
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

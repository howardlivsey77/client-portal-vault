
import { FileUploader } from "./FileUploader";
import { UploadSummary } from "./upload-summary";
import { PayrollFiles, WizardStep } from "./types";

interface WizardStepsProps {
  uploadedFiles: PayrollFiles;
  handleFileUpload: (stepId: keyof PayrollFiles, file: File | null) => void;
  getSummary: (file: File) => Promise<any>;
  isProcessing: boolean;
}

export function createWizardSteps({ 
  uploadedFiles, 
  handleFileUpload, 
  getSummary, 
  isProcessing 
}: WizardStepsProps): WizardStep[] {
  return [
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
          getSummary={getSummary}
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
}

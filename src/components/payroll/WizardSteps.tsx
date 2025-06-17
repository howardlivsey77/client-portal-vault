
import { WizardStep } from "./types";
import { FileUploader } from "./FileUploader";
import { UploadSummary } from "./upload-summary";

interface CreateWizardStepsProps {
  uploadedFiles: any;
  handleFileUpload: (stepId: string, file: File | null) => void;
  getSummary: (file: File) => Promise<any>;
  isProcessing: boolean;
  showEmployeeMapping?: boolean;
  matchingResults?: any;
  onEmployeeMappingConfirm?: (mappings: Record<string, string>) => void;
  onEmployeeMappingCancel?: () => void;
}

export function createWizardSteps({
  uploadedFiles,
  handleFileUpload,
  getSummary,
  isProcessing
}: CreateWizardStepsProps): WizardStep[] {
  const steps: WizardStep[] = [
    {
      title: "Upload Extra Hours File",
      component: (
        <FileUploader
          uploadedFile={uploadedFiles.extraHours}
          onFileChange={(file) => handleFileUpload('extraHours', file)}
          acceptedFileTypes=".csv,.xlsx,.xls"
          description="Select your extra hours file (CSV, Excel)"
        />
      ),
    },
    {
      title: "Review Summary",
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
      title: "Upload Absences File",
      component: (
        <FileUploader
          uploadedFile={uploadedFiles.absences}
          onFileChange={(file) => handleFileUpload('absences', file)}
          acceptedFileTypes=".csv,.xlsx,.xls"
          description="Select your absences file (CSV, Excel) - Optional"
        />
      ),
    }
  ];

  return steps;
}

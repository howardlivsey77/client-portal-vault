
import { WizardStep } from "./types";
import { FileUploader } from "./FileUploader";
import { UploadSummary, FinalSummary } from "./upload-summary";

interface CreateWizardStepsProps {
  uploadedFiles: any;
  handleFileUpload: (stepId: string, file: File | null) => void;
  getSummary: (file: File) => Promise<any>;
  isProcessing: boolean;
  processedData?: any;
  showEmployeeMapping?: boolean;
  matchingResults?: any;
  onEmployeeMappingConfirm?: (mappings: Record<string, string>) => void;
  onEmployeeMappingCancel?: () => void;
}

export function createWizardSteps({
  uploadedFiles,
  handleFileUpload,
  getSummary,
  isProcessing,
  processedData
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
    },
    {
      title: "Final Summary",
      component: processedData && uploadedFiles.extraHours ? (
        <FinalSummary
          extraHoursFile={uploadedFiles.extraHours}
          absencesFile={uploadedFiles.absences}
          extraHoursSummary={processedData}
        />
      ) : (
        <div className="text-center text-muted-foreground">
          Processing data...
        </div>
      ),
    }
  ];

  return steps;
}

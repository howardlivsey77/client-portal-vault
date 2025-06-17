
import { WizardStep } from "./types";
import { FileUploader } from "./FileUploader";
import { UploadSummary } from "./upload-summary";
import { EmployeeMappingDialog } from "./EmployeeMappingDialog";

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
  isProcessing,
  showEmployeeMapping = false,
  matchingResults,
  onEmployeeMappingConfirm,
  onEmployeeMappingCancel
}: CreateWizardStepsProps): WizardStep[] {
  const steps: WizardStep[] = [
    {
      title: "Upload Extra Hours File",
      component: (
        <FileUploader
          file={uploadedFiles.extraHours}
          onFileChange={(file) => handleFileUpload('extraHours', file)}
          acceptedTypes=".csv,.xlsx,.xls"
          placeholder="Select your extra hours file (CSV, Excel)"
        />
      ),
    },
    {
      title: "Review Summary",
      component: (
        <UploadSummary 
          file={uploadedFiles.extraHours}
          getSummary={getSummary}
          isProcessing={isProcessing}
        />
      ),
    }
  ];

  // Add employee mapping step if needed
  if (showEmployeeMapping && matchingResults && onEmployeeMappingConfirm && onEmployeeMappingCancel) {
    steps.splice(2, 0, {
      title: "Map Employees",
      component: (
        <EmployeeMappingDialog
          open={true}
          onOpenChange={() => {}}
          matchingResults={matchingResults}
          onConfirm={onEmployeeMappingConfirm}
          onCancel={onEmployeeMappingCancel}
        />
      ),
    });
  }

  steps.push({
    title: "Upload Absences File",
    component: (
      <FileUploader
        file={uploadedFiles.absences}
        onFileChange={(file) => handleFileUpload('absences', file)}
        acceptedTypes=".csv,.xlsx,.xls"
        placeholder="Select your absences file (CSV, Excel) - Optional"
      />
    ),
  });

  return steps;
}

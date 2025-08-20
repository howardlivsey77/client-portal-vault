import { ExtraHoursSummary, PayrollFiles } from "../types";
import { FileSummary } from "./FileSummary";
import { SummaryCards } from "./SummaryCards";
import { EmployeeHoursTable } from "./EmployeeHoursTable";
import { ExportCSVButton } from "./ExportCSVButton";
import { ExportPDFButton } from "./ExportPDFButton";

interface FinalSummaryProps {
  extraHoursFile: File;
  absencesFile: File | null;
  extraHoursSummary: ExtraHoursSummary;
}

export function FinalSummary({ 
  extraHoursFile, 
  absencesFile, 
  extraHoursSummary 
}: FinalSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Final Payroll Summary</h3>
        <p className="text-sm text-muted-foreground">
          Review the complete payroll data before finalizing.
        </p>
      </div>

      {/* Files Overview */}
      <div className="space-y-3">
        <h4 className="text-md font-medium">Uploaded Files</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Extra Hours File</p>
              <p className="text-sm text-muted-foreground">{extraHoursFile.name}</p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Processed
            </span>
          </div>
          
          {absencesFile ? (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Absences File</p>
                <p className="text-sm text-muted-foreground">{absencesFile.name}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Uploaded
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-muted-foreground">Absences File</p>
                <p className="text-sm text-muted-foreground">No file uploaded (optional)</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                Skipped
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Export Actions */}
      <div className="flex justify-end gap-2">
        <ExportCSVButton summary={extraHoursSummary} />
        <ExportPDFButton 
          summary={extraHoursSummary} 
          filename="complete-payroll-report.pdf"
        />
      </div>

      {/* Summary Data */}
      <SummaryCards summary={extraHoursSummary} />
      <EmployeeHoursTable employeeDetails={extraHoursSummary.employeeDetails} />
    </div>
  );
}
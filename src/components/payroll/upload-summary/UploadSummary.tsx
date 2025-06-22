
import { useState, useEffect, useCallback } from "react";
import { ExtraHoursSummary } from "../types";
import { FileSummary } from "./FileSummary";
import { SummaryCards } from "./SummaryCards";
import { EmployeeHoursTable } from "./EmployeeHoursTable";
import { ProcessingState } from "./ProcessingState";
import { ErrorState } from "./ErrorState";
import { NoDataState } from "./NoDataState";
import { SuccessState } from "./SuccessState";
import { ExportPDFButton } from "./ExportPDFButton";

interface UploadSummaryProps {
  file: File | null;
  type: "extraHours" | "absences";
  getSummary: (file: File) => Promise<ExtraHoursSummary>;
  isProcessing: boolean;
}

export function UploadSummary({ file, type, getSummary, isProcessing }: UploadSummaryProps) {
  const [summary, setSummary] = useState<ExtraHoursSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  
  const processFile = useCallback(async () => {
    if (!file) return;
    
    try {
      setError(null);
      setLocalLoading(true);
      const data = await getSummary(file);
      setSummary(data);
      console.log("Processed summary data:", data);
    } catch (err) {
      console.error("Error in UploadSummary:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process file. Please check the format and try again.";
      setError(errorMessage);
      setSummary(null);
    } finally {
      setLocalLoading(false);
    }
  }, [file, getSummary]);
  
  useEffect(() => {
    if (file && !summary) {
      processFile();
    }
  }, [file, summary, processFile]);

  // Reset state when file changes
  useEffect(() => {
    if (!file) {
      setSummary(null);
      setError(null);
    }
  }, [file]);

  if (!file) {
    return <div>No file uploaded</div>;
  }
  
  if (isProcessing || localLoading) {
    return <ProcessingState />;
  }
  
  if (error) {
    return <ErrorState error={error} />;
  }
  
  if (!summary || !summary.employeeDetails || summary.employeeDetails.length === 0) {
    return <NoDataState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <FileSummary file={file} />
        <ExportPDFButton summary={summary} />
      </div>
      <SummaryCards summary={summary} />
      <EmployeeHoursTable employeeDetails={summary.employeeDetails} />
      <SuccessState />
    </div>
  );
}

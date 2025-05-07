
import { useState, useEffect } from "react";
import { ExtraHoursSummary } from "../types";
import { FileSummary } from "./FileSummary";
import { SummaryCards } from "./SummaryCards";
import { EmployeeHoursTable } from "./EmployeeHoursTable";
import { ProcessingState } from "./ProcessingState";
import { ErrorState } from "./ErrorState";
import { NoDataState } from "./NoDataState";
import { SuccessState } from "./SuccessState";

interface UploadSummaryProps {
  file: File | null;
  type: "extraHours" | "absences";
  getSummary: (file: File) => Promise<ExtraHoursSummary>;
  isProcessing: boolean;
}

export function UploadSummary({ file, type, getSummary, isProcessing }: UploadSummaryProps) {
  const [summary, setSummary] = useState<ExtraHoursSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    async function processFile() {
      if (!file) return;
      
      try {
        setError(null);
        setLoading(true);
        const data = await getSummary(file);
        setSummary(data);
        console.log("Processed summary data:", data);
      } catch (err) {
        console.error("Error in UploadSummary:", err);
        setError("Failed to process file. Please check the format and try again.");
      } finally {
        setLoading(false);
      }
    }
    
    if (file) {
      processFile();
    }
  }, [file, getSummary]);

  if (!file) {
    return <div>No file uploaded</div>;
  }
  
  if (isProcessing || loading) {
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
      <FileSummary file={file} />
      <SummaryCards summary={summary} />
      <EmployeeHoursTable employeeDetails={summary.employeeDetails} />
      <SuccessState />
    </div>
  );
}

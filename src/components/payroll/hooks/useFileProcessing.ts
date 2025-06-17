
import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { processExtraHoursFile } from "@/services/payroll";
import { ExtraHoursSummary, PayrollFiles } from "../types";
import { setProcessedPayrollData, clearProcessedPayrollData } from "./services/payrollDataService";

export function useFileProcessing() {
  const [uploadedFiles, setUploadedFiles] = useState<PayrollFiles>({
    extraHours: null,
    absences: null,
  });
  const [processedData, setProcessedData] = useState<ExtraHoursSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (stepId: keyof PayrollFiles, file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [stepId]: file
    }));
    
    // Reset processed data when a new file is uploaded
    if (stepId === 'extraHours') {
      setProcessedData(null);
      clearProcessedPayrollData();
    }
  };

  const processExtraHours = useCallback(async (file: File): Promise<ExtraHoursSummary> => {
    console.log("Processing file:", file.name);
    
    if (processedData) {
      return processedData;
    }
    
    try {
      setIsProcessing(true);
      const result = await processExtraHoursFile(file);
      setProcessedData(result);
      
      // Store in global state for sharing with reports
      setProcessedPayrollData(result);
      
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

  const resetFileProcessing = () => {
    setProcessedData(null);
    clearProcessedPayrollData();
  };

  return {
    uploadedFiles,
    processedData,
    isProcessing,
    handleFileUpload,
    processExtraHours,
    resetFileProcessing,
  };
}

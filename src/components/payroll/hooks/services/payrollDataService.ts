
import { ExtraHoursSummary } from "../../types";

// Simple store for sharing data between components
// In a real app, you might use a more robust state management solution
let globalProcessedData: ExtraHoursSummary | null = null;

export const getProcessedPayrollData = (): ExtraHoursSummary | null => {
  return globalProcessedData;
};

export const setProcessedPayrollData = (data: ExtraHoursSummary | null): void => {
  globalProcessedData = data;
};

export const clearProcessedPayrollData = (): void => {
  globalProcessedData = null;
};

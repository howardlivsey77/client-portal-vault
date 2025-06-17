import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { EmployeeConflict } from "./enhancedEmployeeMatching";

// Re-export all functionality from the refactored modules
export { validateImportData, type ImportValidationResult } from "./validationService";
export { executeImport, type ImportResult } from "./executionService";
export { findExistingEmployees } from "./existingEmployeeFinder";

// Keep the original interface exports for backward compatibility
export interface ImportResult {
  success: boolean;
  message: string;
  error?: any;
  duplicateCheckResult?: any;
  conflicts?: EmployeeConflict[];
}

export interface ImportValidationResult {
  canProceed: boolean;
  duplicateCheckResult: any;
  conflicts: EmployeeConflict[];
  message: string;
}

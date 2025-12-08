
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { createNewEmployees, updateExistingEmployees } from "@/services/employees/import";
import { EmployeeConflict } from "./enhancedEmployeeMatching";
import { validateImportData, ImportValidationResult } from "./validationService";

export interface ImportResult {
  success: boolean;
  message: string;
  error?: any;
  duplicateCheckResult?: any;
  conflicts?: EmployeeConflict[];
}

/**
 * Handle the import operation
 */
export const executeImport = async (
  newEmployees: EmployeeData[],
  updatedEmployees: { existing: EmployeeData; imported: EmployeeData }[],
  conflicts: EmployeeConflict[] = []
): Promise<ImportResult> => {
  try {
    // Validate before proceeding
    const validation = await validateImportData(newEmployees, updatedEmployees, conflicts);
    
    if (!validation.canProceed) {
      return {
        success: false,
        message: validation.message,
        duplicateCheckResult: validation.duplicateCheckResult,
        conflicts: validation.conflicts
      };
    }
    
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Process new employees
    await createNewEmployees(newEmployees, user.id);
    
    // Process updated employees
    await updateExistingEmployees(updatedEmployees);
    
    return {
      success: true,
      message: `${newEmployees.length} employees added and ${updatedEmployees.length} employees updated.`,
      duplicateCheckResult: validation.duplicateCheckResult
    };
  } catch (error: any) {
    // Check for specific database constraint violations
    if (error.message && error.message.includes("unique_payroll_id")) {
      return {
        success: false,
        message: "Import failed: One or more employees have duplicate payroll IDs. Each employee must have a unique payroll ID.",
        error
      };
    }
    
    return {
      success: false,
      message: error.message || "Error importing employees",
      error
    };
  }
};


import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { 
  executeImport as importEmployees, 
  findExistingEmployees,
  type ImportResult
} from "@/services/employeeImport";

// Handle the import operation
export const executeImport = async (
  newEmployees: EmployeeData[],
  updatedEmployees: { existing: EmployeeData; imported: EmployeeData }[]
): Promise<ImportResult> => {
  try {
    // Use the executeImport function from the employeeImport service
    return await importEmployees(newEmployees, updatedEmployees);
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

// Re-export the findExistingEmployees function
export { findExistingEmployees };


import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { createNewEmployees } from "./createEmployeeService";
import { updateExistingEmployees } from "./updateEmployeeService";
import { findExistingEmployees, checkDuplicatePayrollIds } from "./checkExistingService";

export interface ImportResult {
  success: boolean;
  message: string;
  error?: any;
}

// Handle the import operation
export const executeImport = async (
  newEmployees: EmployeeData[],
  updatedEmployees: { existing: EmployeeData; imported: EmployeeData }[]
): Promise<ImportResult> => {
  try {
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
      message: `${newEmployees.length} employees added and ${updatedEmployees.length} employees updated.`
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

// Re-export utility functions
export { 
  findExistingEmployees,
  checkDuplicatePayrollIds,
  createNewEmployees,
  updateExistingEmployees
};

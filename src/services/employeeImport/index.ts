
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { createNewEmployees } from "./createEmployeeService";
import { updateExistingEmployees } from "./updateEmployeeService";
import { findExistingEmployees, checkDuplicatePayrollIds } from "./checkExistingService";

export interface ImportResult {
  success: boolean;
  message: string;
  error?: any;
  details?: {
    newCount: number;
    updateCount: number;
  };
}

// Handle the import operation
export const executeImport = async (
  newEmployees: EmployeeData[],
  updatedEmployees: { existing: EmployeeData; imported: EmployeeData }[]
): Promise<ImportResult> => {
  try {
    console.log(`Starting import with ${newEmployees.length} new employees and ${updatedEmployees.length} updates`);
    
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Process updated employees first
    if (updatedEmployees.length > 0) {
      console.log(`Processing ${updatedEmployees.length} employee updates`);
      await updateExistingEmployees(updatedEmployees);
    }
    
    // Process new employees if any
    if (newEmployees.length > 0) {
      console.log(`Processing ${newEmployees.length} new employees`);
      await createNewEmployees(newEmployees, user.id);
    }
    
    return {
      success: true,
      message: `${updatedEmployees.length > 0 ? `${updatedEmployees.length} employees updated` : ""}${
        newEmployees.length > 0 && updatedEmployees.length > 0 ? " and " : ""
      }${newEmployees.length > 0 ? `${newEmployees.length} employees added` : ""}.`,
      details: {
        newCount: newEmployees.length,
        updateCount: updatedEmployees.length
      }
    };
  } catch (error: any) {
    console.error("Import failed with error:", error);
    
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

// Use 'export type' when re-exporting types with isolatedModules enabled
export type { ImportResult };

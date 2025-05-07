
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { createNewEmployees, updateExistingEmployees } from "@/services/employeeImportService";

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
    return {
      success: false,
      message: error.message || "Error importing employees",
      error
    };
  }
};

// Check for existing employees
export const findExistingEmployees = async (importData: EmployeeData[]): Promise<EmployeeData[]> => {
  try {
    // Extract emails and names from import data
    const emails = importData
      .filter(emp => emp.email)
      .map(emp => emp.email);
    
    console.log("Checking for existing employees with emails:", emails);
    
    // Query database for existing employees with matching emails
    const { data: existingEmployees, error } = await supabase
      .from("employees")
      .select("*")
      .in("email", emails.length > 0 ? emails : ['no-emails-found']);
    
    if (error) throw error;
    
    console.log("Found existing employees:", existingEmployees);
    return existingEmployees || [];
  } catch (error) {
    console.error("Error checking for existing employees:", error);
    return [];
  }
};

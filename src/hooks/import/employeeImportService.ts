
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

// Check for existing employees
export const findExistingEmployees = async (importData: EmployeeData[]): Promise<EmployeeData[]> => {
  try {
    // Extract emails and payroll_ids from import data
    const emails = importData
      .filter(emp => emp.email)
      .map(emp => emp.email);
    
    const payrollIds = importData
      .filter(emp => emp.payroll_id && emp.payroll_id.trim() !== '')
      .map(emp => emp.payroll_id.trim());
    
    console.log("Checking for existing employees with emails:", emails);
    console.log("Checking for existing employees with payroll IDs:", payrollIds);
    
    let allMatches: EmployeeData[] = [];
    
    // Only run query if we have emails to check
    if (emails.length > 0) {
      // Check for existing employees with matching emails
      const { data: emailMatches, error: emailError } = await supabase
        .from("employees")
        .select("*")
        .in("email", emails);
      
      if (emailError) throw emailError;
      
      if (emailMatches) {
        allMatches = [...emailMatches];
      }
    }
    
    // Only run query if we have payroll IDs to check
    if (payrollIds.length > 0) {
      // Check for existing employees with matching payroll IDs
      const { data: payrollMatches, error: payrollError } = await supabase
        .from("employees")
        .select("*")
        .in("payroll_id", payrollIds);
      
      if (payrollError) throw payrollError;
      
      if (payrollMatches) {
        // Add unique payroll matches (that aren't already in the array from email matches)
        payrollMatches.forEach(employee => {
          if (!allMatches.some(e => e.id === employee.id)) {
            allMatches.push(employee);
          }
        });
      }
    }
    
    console.log("Found existing employees:", allMatches);
    return allMatches;
  } catch (error) {
    console.error("Error checking for existing employees:", error);
    return [];
  }
};

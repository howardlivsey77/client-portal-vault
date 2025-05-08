
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";

// Check for duplicate payroll IDs
export const checkDuplicatePayrollIds = async (payrollIds: string[]) => {
  if (!payrollIds || payrollIds.length === 0) return [];
  
  // Filter out empty strings or undefined values
  const validIds = payrollIds.filter(id => id && id.trim() !== '');
  
  if (validIds.length === 0) return [];
  
  const { data } = await supabase
    .from("employees")
    .select("payroll_id")
    .in("payroll_id", validIds);
    
  return data ? data.map(emp => emp.payroll_id) : [];
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


import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { checkDuplicatePayrollIds } from "./checkExistingService";
import { updateWorkPatterns, updateWorkPatternsFromFields } from "./workPatternService";
import { prepareEmployeeUpdates, extractNewPayrollIds } from "./employeeDataUtils";

// Process updated employees
export const updateExistingEmployees = async (
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[]
) => {
  console.log(`Processing ${updatedEmployees.length} employee updates`);
  
  // Extract all new payroll IDs from updates where they differ from existing
  const newPayrollIds = extractNewPayrollIds(updatedEmployees);
  
  // Check for duplicates in the database if we have any new payroll IDs
  if (newPayrollIds.length > 0) {
    const existingPayrollIds = await checkDuplicatePayrollIds(newPayrollIds);
    
    // If we have duplicate payroll IDs, throw an error
    if (existingPayrollIds.length > 0) {
      console.error("Duplicate payroll IDs found in database:", existingPayrollIds);
      throw new Error(`duplicate key value violates unique constraint "unique_payroll_id" for IDs: ${existingPayrollIds.join(', ')}`);
    }
  }
  
  // Process each employee update
  for (const { existing, imported } of updatedEmployees) {
    await updateSingleEmployee(existing, imported);
  }
};

// Update a single employee
const updateSingleEmployee = async (
  existing: EmployeeData, 
  imported: EmployeeData
) => {
  console.log(`Updating employee ID ${existing.id}: ${existing.first_name} ${existing.last_name}`);
  
  // Prepare employee updates and extract work pattern fields
  const { employeeUpdates, workPatternFields } = prepareEmployeeUpdates(imported);
  
  console.log("Applying these employee updates:", employeeUpdates);
  
  // Only update if there are actual changes
  if (Object.keys(employeeUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from("employees")
      .update(employeeUpdates)
      .eq("id", existing.id);
    
    if (updateError) {
      console.error("Error updating employee:", updateError);
      throw updateError;
    }
  } else {
    console.log("No employee fields to update for this employee");
  }
  
  // Handle work patterns if they exist in the imported data
  if (imported.work_pattern) {
    await updateWorkPatterns(imported, existing.id);
  } else if (Object.keys(workPatternFields).length > 0) {
    // We have work pattern fields but not a pre-processed work_pattern object
    console.log("Updating work patterns from individual fields:", workPatternFields);
    await updateWorkPatternsFromFields(workPatternFields, existing.id);
  }
};

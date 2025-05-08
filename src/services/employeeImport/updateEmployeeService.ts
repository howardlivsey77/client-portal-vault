
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { checkDuplicatePayrollIds } from "./checkExistingService";

// Process updated employees
export const updateExistingEmployees = async (
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[]
) => {
  console.log(`Processing ${updatedEmployees.length} employee updates`);
  
  // Extract all new payroll IDs from updates where they differ from existing
  const newPayrollIds = updatedEmployees
    .filter(({ existing, imported }) => 
      imported.payroll_id && 
      imported.payroll_id.trim() !== '' &&
      imported.payroll_id !== existing.payroll_id)
    .map(({ imported }) => imported.payroll_id.trim());
  
  // Check for duplicates in the database if we have any new payroll IDs
  if (newPayrollIds.length > 0) {
    const existingPayrollIds = await checkDuplicatePayrollIds(newPayrollIds);
    
    // If we have duplicate payroll IDs, throw an error
    if (existingPayrollIds.length > 0) {
      console.error("Duplicate payroll IDs found in database:", existingPayrollIds);
      throw new Error(`duplicate key value violates unique constraint "unique_payroll_id" for IDs: ${existingPayrollIds.join(', ')}`);
    }
  }
  
  for (const { existing, imported } of updatedEmployees) {
    console.log(`Updating employee ID ${existing.id}: ${existing.first_name} ${existing.last_name}`);
    
    const updates: any = {};
    
    // Only include fields that have values in the imported data
    // This ensures we don't overwrite existing data with empty values
    Object.keys(imported).forEach(key => {
      if (key !== 'id' && key !== 'work_pattern' && 
          imported[key] !== undefined && imported[key] !== null && 
          imported[key] !== '') {
        
        // For payroll_id, ensure it's trimmed
        if (key === 'payroll_id' && imported[key]) {
          updates[key] = imported[key].trim();
        } else {
          updates[key] = imported[key];
        }
      }
    });
    
    // Always round numeric fields
    if ('hourly_rate' in updates) updates.hourly_rate = roundToTwoDecimals(updates.hourly_rate);
    if ('rate_2' in updates) updates.rate_2 = roundToTwoDecimals(updates.rate_2);
    if ('rate_3' in updates) updates.rate_3 = roundToTwoDecimals(updates.rate_3);
    if ('rate_4' in updates) updates.rate_4 = roundToTwoDecimals(updates.rate_4);
    
    console.log("Applying these updates:", updates);
    
    // Only update if there are actual changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("employees")
        .update(updates)
        .eq("id", existing.id);
      
      if (updateError) {
        console.error("Error updating employee:", updateError);
        throw updateError;
      }
    } else {
      console.log("No fields to update for this employee");
    }
    
    // Always check for work pattern updates
    await updateWorkPatterns(imported, existing.id);
  }
};

// Helper function to update work patterns
const updateWorkPatterns = async (imported: EmployeeData, employeeId: string) => {
  // Handle work patterns if they exist in the imported data
  if (imported.work_pattern) {
    try {
      // Parse work patterns
      const workPatterns: WorkDay[] = JSON.parse(imported.work_pattern);
      
      // First delete existing work patterns
      await supabase
        .from('work_patterns')
        .delete()
        .eq('employee_id', employeeId);
        
      // Then insert new work patterns
      const workPatternsToInsert = workPatterns.map(pattern => ({
        employee_id: employeeId,
        day: pattern.day,
        is_working: pattern.isWorking,
        start_time: pattern.startTime,
        end_time: pattern.endTime
      }));
      
      if (workPatternsToInsert.length > 0) {
        const { error } = await supabase
          .from('work_patterns')
          .insert(workPatternsToInsert);
          
        if (error) console.error("Error inserting updated work patterns:", error);
      }
    } catch (e) {
      console.error("Error processing updated work pattern data:", e);
    }
  }
};

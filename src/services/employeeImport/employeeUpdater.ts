
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { checkDuplicatePayrollIds } from "./duplicateChecker";
import { extractNewPayrollIds, normalizePayrollId } from "./payrollIdUtils";
import { prepareWorkPatterns, prepareWorkPatternsForInsert } from "./workPatternUtils";

/**
 * Process updated employees and update them in the database
 */
export const updateExistingEmployees = async (
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[]
): Promise<void> => {
  // Extract all new payroll IDs from updates where they differ from existing
  const newPayrollIds = extractNewPayrollIds(updatedEmployees);
  
  // Check for duplicates in the database if we have any new payroll IDs
  if (newPayrollIds.length > 0) {
    const existingPayrollIds = await checkDuplicatePayrollIds(newPayrollIds);
    
    // If we have duplicate payroll IDs, throw an error
    if (existingPayrollIds.length > 0) {
      throw new Error(`duplicate key value violates unique constraint "unique_payroll_id" for IDs: ${existingPayrollIds.join(', ')}`);
    }
  }
  
  for (const { existing, imported } of updatedEmployees) {
    console.log("Updating employee:", existing.id);
    
    const updates: any = {};
    
    // Only include fields that have changed
    Object.keys(imported).forEach(key => {
      if (key !== 'id' && 
          imported[key] !== undefined && imported[key] !== null && 
          imported[key] !== '' && imported[key] !== existing[key]) {
        // Handle payroll_id specially to convert to string
        if (key === 'payroll_id') {
          updates[key] = normalizePayrollId(imported[key]);
        } else {
          updates[key] = imported[key];
        }
      }
    });
    
    // Always include rounded rate fields in updates if they exist in the imported data
    if (imported.rate_2 !== undefined) updates.rate_2 = roundToTwoDecimals(imported.rate_2);
    if (imported.rate_3 !== undefined) updates.rate_3 = roundToTwoDecimals(imported.rate_3);
    if (imported.rate_4 !== undefined) updates.rate_4 = roundToTwoDecimals(imported.rate_4);
    
    // Update hourly_rate with rounding
    if (imported.hourly_rate !== undefined) {
      updates.hourly_rate = roundToTwoDecimals(imported.hourly_rate);
    }
    
    // Update employee if there are changes
    if (Object.keys(updates).length > 0) {
      console.log("Updating employee with data:", updates);
      const { error: updateError } = await supabase
        .from("employees")
        .update(updates)
        .eq("id", existing.id);
      
      if (updateError) throw updateError;
      
      // Update work patterns if we have them in the imported data
      if (existing.id) {
        const workPatterns = prepareWorkPatterns(imported);
        const extractedPatterns = prepareWorkPatterns(imported);
        
        if (extractedPatterns) {
          const normalizedPayrollId = normalizePayrollId(imported.payroll_id);
          
          // Update work patterns with the new payroll_id
          const workPatternsToInsert = prepareWorkPatternsForInsert(workPatterns, existing.id, normalizedPayrollId);
          
          // Delete existing work patterns
          const { error: deleteError } = await supabase
            .from('work_patterns')
            .delete()
            .eq('employee_id', existing.id);
            
          if (deleteError) {
            console.error("Failed to delete existing work patterns during update:", deleteError);
          } else {
            // Insert new work patterns
            const { error: insertError } = await supabase
              .from('work_patterns')
              .insert(workPatternsToInsert);
              
            if (insertError) {
              console.error("Failed to insert updated work patterns:", insertError);
            }
          }
        }
      }
    }
  }
};

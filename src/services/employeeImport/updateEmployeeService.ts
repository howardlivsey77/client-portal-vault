
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { checkDuplicatePayrollIds } from "./checkExistingService";
import { parseBooleanValue } from "@/components/employees/import/utils/booleanUtils";
import { normalizeTimeString } from "@/components/employees/import/utils/timeUtils";

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
    
    // Separate employee data fields from work pattern fields
    const employeeUpdates: any = {};
    const workPatternFields: Record<string, any> = {};
    
    // Only include fields that have values in the imported data
    Object.keys(imported).forEach(key => {
      // Skip id and work_pattern JSON string as we'll handle those separately
      if (key === 'id' || key === 'work_pattern') {
        return;
      }
      
      // Skip empty values
      if (imported[key] === undefined || imported[key] === null || imported[key] === '') {
        return;
      }
      
      // Check if this is a work pattern field
      if (key.includes('_working') || key.includes('_start_time') || key.includes('_end_time')) {
        console.log(`Found work pattern field: ${key} = ${imported[key]}`);
        workPatternFields[key] = imported[key];
      } else {
        // For payroll_id, ensure it's trimmed
        if (key === 'payroll_id' && imported[key]) {
          employeeUpdates[key] = imported[key].trim();
        } else {
          employeeUpdates[key] = imported[key];
        }
      }
    });
    
    // Always round numeric fields
    if ('hourly_rate' in employeeUpdates) employeeUpdates.hourly_rate = roundToTwoDecimals(employeeUpdates.hourly_rate);
    if ('rate_2' in employeeUpdates) employeeUpdates.rate_2 = roundToTwoDecimals(employeeUpdates.rate_2);
    if ('rate_3' in employeeUpdates) employeeUpdates.rate_3 = roundToTwoDecimals(employeeUpdates.rate_3);
    if ('rate_4' in employeeUpdates) employeeUpdates.rate_4 = roundToTwoDecimals(employeeUpdates.rate_4);
    
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
  }
};

// Helper function to update work patterns
const updateWorkPatterns = async (imported: EmployeeData, employeeId: string) => {
  try {
    // Parse work patterns
    const workPatterns: WorkDay[] = JSON.parse(imported.work_pattern);
    console.log(`Updating ${workPatterns.length} work patterns for employee ${employeeId}`);
    
    // First delete existing work patterns
    const { error: deleteError } = await supabase
      .from('work_patterns')
      .delete()
      .eq('employee_id', employeeId);
      
    if (deleteError) {
      console.error("Error deleting existing work patterns:", deleteError);
      throw deleteError;
    }
    
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
        
      if (error) {
        console.error("Error inserting updated work patterns:", error);
        throw error;
      } else {
        console.log(`Successfully inserted ${workPatternsToInsert.length} work patterns`);
      }
    }
  } catch (e) {
    console.error("Error processing updated work pattern data:", e);
  }
};

// Helper function to update work patterns from individual fields
const updateWorkPatternsFromFields = async (workPatternFields: Record<string, any>, employeeId: string) => {
  try {
    // Group fields by day
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const workPatterns: any[] = [];
    
    console.log("Work pattern fields received:", workPatternFields);
    
    for (const day of days) {
      const isWorkingField = `${day}_working`;
      const startTimeField = `${day}_start_time`;
      const endTimeField = `${day}_end_time`;
      
      // Always include all days in the work pattern
      // Default to working = true if not specified
      let isWorking = true;
      let startTime = null;
      let endTime = null;
      
      // Check if we have work pattern data for this day
      if (workPatternFields[isWorkingField] !== undefined) {
        // Parse the working status
        isWorking = parseBooleanValue(workPatternFields[isWorkingField]);
      }
      
      // Get start and end times if they exist
      if (workPatternFields[startTimeField] !== undefined) {
        startTime = normalizeTimeString(workPatternFields[startTimeField]);
      }
      
      if (workPatternFields[endTimeField] !== undefined) {
        endTime = normalizeTimeString(workPatternFields[endTimeField]);
      }
      
      // If no explicit working status, but both times are empty, assume not working
      if (workPatternFields[isWorkingField] === undefined && !startTime && !endTime) {
        isWorking = false;
      }
      
      console.log(`Creating work pattern for ${day}: working=${isWorking}, start=${startTime}, end=${endTime}`);
      
      // Add to work patterns
      workPatterns.push({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        isWorking,
        startTime,
        endTime
      });
    }
    
    // Only proceed if we found any work patterns
    if (workPatterns.length > 0) {
      console.log(`Found ${workPatterns.length} days with work pattern data:`, workPatterns);
      
      // Delete existing work patterns
      const { error: deleteError } = await supabase
        .from('work_patterns')
        .delete()
        .eq('employee_id', employeeId);
        
      if (deleteError) {
        console.error("Error deleting existing work patterns:", deleteError);
        throw deleteError;
      }
      
      // Insert new work patterns
      const workPatternsToInsert = workPatterns.map(pattern => ({
        employee_id: employeeId,
        day: pattern.day,
        is_working: pattern.isWorking,
        start_time: pattern.startTime,
        end_time: pattern.endTime
      }));
      
      const { error } = await supabase
        .from('work_patterns')
        .insert(workPatternsToInsert);
        
      if (error) {
        console.error("Error inserting work patterns from fields:", error);
        throw error;
      } else {
        console.log(`Successfully inserted ${workPatternsToInsert.length} work patterns from fields`);
      }
    } else {
      console.log("No work pattern data found in fields");
    }
  } catch (e) {
    console.error("Error processing work pattern fields:", e);
  }
};

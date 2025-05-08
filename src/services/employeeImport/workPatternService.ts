
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { parseBooleanValue } from "@/components/employees/import/utils/booleanUtils";
import { normalizeTimeString } from "@/components/employees/import/utils/timeUtils";

// Helper function to update work patterns from JSON data
export const updateWorkPatterns = async (imported: EmployeeData, employeeId: string) => {
  try {
    // Parse work patterns
    const workPatterns: WorkDay[] = JSON.parse(imported.work_pattern);
    console.log(`Updating ${workPatterns.length} work patterns for employee ${employeeId}`);
    
    // First delete existing work patterns
    await deleteExistingWorkPatterns(employeeId);
    
    // Then insert new work patterns
    await insertWorkPatterns(workPatterns, employeeId);
  } catch (e) {
    console.error("Error processing updated work pattern data:", e);
    throw e;
  }
};

// Helper function to update work patterns from individual fields
export const updateWorkPatternsFromFields = async (workPatternFields: Record<string, any>, employeeId: string) => {
  try {
    // Extract work patterns from fields
    const workPatterns = extractWorkPatternsFromFields(workPatternFields);
    
    // Only proceed if we found any work patterns
    if (workPatterns.length > 0) {
      console.log(`Found ${workPatterns.length} days with work pattern data:`, workPatterns);
      
      // Delete existing work patterns
      await deleteExistingWorkPatterns(employeeId);
      
      // Insert new work patterns
      await insertWorkPatterns(workPatterns, employeeId);
    } else {
      console.log("No work pattern data found in fields");
    }
  } catch (e) {
    console.error("Error processing work pattern fields:", e);
    throw e;
  }
};

// Helper function to extract work patterns from individual fields
const extractWorkPatternsFromFields = (workPatternFields: Record<string, any>): WorkDay[] => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const workPatterns: WorkDay[] = [];
  
  console.log("Work pattern fields received:", workPatternFields);
  
  for (const day of days) {
    const isWorkingField = `${day}_working`;
    const startTimeField = `${day}_start_time`;
    const endTimeField = `${day}_end_time`;
    
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
  
  return workPatterns;
};

// Helper function to delete existing work patterns
const deleteExistingWorkPatterns = async (employeeId: string) => {
  const { error: deleteError } = await supabase
    .from('work_patterns')
    .delete()
    .eq('employee_id', employeeId);
    
  if (deleteError) {
    console.error("Error deleting existing work patterns:", deleteError);
    throw deleteError;
  }
  
  return true;
};

// Helper function to insert work patterns
const insertWorkPatterns = async (workPatterns: WorkDay[], employeeId: string) => {
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
      console.error("Error inserting work patterns:", error);
      throw error;
    } else {
      console.log(`Successfully inserted ${workPatternsToInsert.length} work patterns`);
    }
  }
  
  return workPatternsToInsert.length;
};

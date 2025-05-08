
import { EmployeeData } from "../ImportConstants";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { parseBooleanValue } from "./booleanUtils";
import { normalizeTimeString } from "./timeUtils";

// Extract work pattern data from an employee record
export const extractWorkPattern = (row: EmployeeData): WorkDay[] => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Create an array to store all work patterns
  const workPatterns: WorkDay[] = [];
  
  // Process each day
  for (const day of days) {
    const isWorkingField = `${day}_working`;
    const startTimeField = `${day}_start_time`;
    const endTimeField = `${day}_end_time`;
    
    // Check if any work pattern data is present for this day
    const hasWorkPatternData = row[isWorkingField] !== undefined || 
                              row[startTimeField] !== undefined || 
                              row[endTimeField] !== undefined;
    
    // Always include all days, regardless of whether data is present
    // This ensures we have a complete work pattern for all days of the week
    
    // Default to true for isWorking if the field is not present
    let isWorking = true;
    
    // If the working field is explicitly set, use that value
    if (row[isWorkingField] !== undefined) {
      isWorking = parseBooleanValue(row[isWorkingField]);
    } 
    // If no working field but we have time data, infer from that
    else if (row[startTimeField] !== undefined || row[endTimeField] !== undefined) {
      // If both start and end times are empty, they're probably not working
      if (!row[startTimeField] && !row[endTimeField]) {
        isWorking = false;
      }
    }
    
    // Normalize time strings
    const startTime = normalizeTimeString(row[startTimeField]);
    const endTime = normalizeTimeString(row[endTimeField]);
    
    console.log(`Adding work pattern for ${day}: working=${isWorking}, start=${startTime}, end=${endTime}`);
    
    // Add this day to the work patterns
    workPatterns.push({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      isWorking,
      startTime,
      endTime
    });
  }
  
  console.log(`Total work patterns extracted: ${workPatterns.length}`);
  return workPatterns;
};

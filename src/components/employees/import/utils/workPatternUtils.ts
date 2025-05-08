
import { EmployeeData } from "../ImportConstants";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { parseBooleanValue } from "./booleanUtils";
import { normalizeTimeString } from "./timeUtils";

// Extract work pattern data from an employee record
export const extractWorkPattern = (row: EmployeeData): WorkDay[] => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return days.map(day => {
    const isWorkingField = `${day}_working`;
    const startTimeField = `${day}_start_time`;
    const endTimeField = `${day}_end_time`;
    
    // Check if any work pattern data is present for this day
    const hasWorkPatternData = row[isWorkingField] !== undefined || 
                              row[startTimeField] !== undefined || 
                              row[endTimeField] !== undefined;
    
    // Default to true for isWorking if the field is not present or if there's start/end time data
    let isWorking = true;
    
    // If the working field is explicitly set, use that value
    if (row[isWorkingField] !== undefined) {
      isWorking = parseBooleanValue(row[isWorkingField]);
    } 
    // If no working field but we have time data, infer from that
    else if (hasWorkPatternData) {
      // If both start and end times are empty, they're probably not working
      if (!row[startTimeField] && !row[endTimeField]) {
        isWorking = false;
      }
    }
    
    // Normalize time strings
    const startTime = normalizeTimeString(row[startTimeField]);
    const endTime = normalizeTimeString(row[endTimeField]);
    
    return {
      day: day.charAt(0).toUpperCase() + day.slice(1),
      isWorking,
      startTime,
      endTime
    };
  });
};

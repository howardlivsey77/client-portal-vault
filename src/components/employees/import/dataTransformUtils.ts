
import { EmployeeData, ColumnMapping, requiredFields } from "./ImportConstants";
import { WorkDay } from "@/components/employees/details/work-pattern/types";

// Helper function to convert Excel numeric dates to ISO date strings
export const excelDateToISO = (excelDate: number | string): string | null => {
  // If it's already a string and looks like a date string, return it
  if (typeof excelDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(excelDate) || 
        /^\d{2}\/\d{2}\/\d{4}/.test(excelDate) ||
        /^\d{2}\.\d{2}\.\d{4}/.test(excelDate)) {
      return new Date(excelDate).toISOString().split('T')[0];
    }
    return null;
  }
  
  // If it's a number, treat it as an Excel date
  if (typeof excelDate === 'number') {
    // Excel's epoch starts on 1900-01-01, but Excel incorrectly assumes 1900 is a leap year
    // So we need to adjust dates after February 28, 1900
    // Excel date 60 corresponds to February 29, 1900 which doesn't exist
    const adjustedExcelDate = excelDate > 60 ? excelDate - 1 : excelDate;
    
    // Convert Excel date to JavaScript date
    // Excel epoch is December 31, 1899
    const msPerDay = 24 * 60 * 60 * 1000;
    const jsDate = new Date(Date.UTC(1899, 11, 30) + (adjustedExcelDate * msPerDay));
    
    return jsDate.toISOString().split('T')[0];
  }
  
  return null;
};

// Helper function to normalize and validate time strings
export const normalizeTimeString = (timeString: string | number | null | undefined): string | null => {
  // Early return for null, undefined or empty values
  if (timeString === null || timeString === undefined || timeString === '') {
    return null;
  }
  
  // Convert to string if it's a number
  const timeStrValue = typeof timeString === 'number' 
    ? timeString.toString() 
    : String(timeString); // Convert to string regardless of type
  
  // Already in 24-hour format like "09:30"
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStrValue)) {
    // Ensure leading zeros for hours
    const [hours, minutes] = timeStrValue.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Try to parse AM/PM format
  const amPmMatch = timeStrValue.match(/^(\d{1,2})(?::(\d{2}))?(?:\s*)?(am|pm|a|p)?$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2] ? parseInt(amPmMatch[2], 10) : 0;
    const ampm = (amPmMatch[3] || '').toLowerCase();
    
    // Convert to 24-hour format
    if (ampm === 'pm' || ampm === 'p') {
      if (hours < 12) hours += 12;
    } else if ((ampm === 'am' || ampm === 'a') && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // For Excel time (fraction of 24 hours)
  if (typeof timeString === 'number' || !isNaN(Number(timeStrValue))) {
    const excelTime = parseFloat(timeStrValue);
    if (excelTime >= 0 && excelTime < 1) {
      const totalMinutes = Math.round(excelTime * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  // If we can't normalize it, return the original string
  return timeStrValue;
};

// Parse boolean value from various formats
export const parseBooleanValue = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  
  if (typeof value === 'boolean') return value;
  
  if (typeof value === 'number') return value !== 0;
  
  if (typeof value === 'string') {
    const str = value.toLowerCase().trim();
    return !(
      str === '' || 
      str === 'false' || 
      str === 'no' || 
      str === '0' || 
      str === 'n' ||
      str === 'off' ||
      str === 'inactive'
    );
  }
  
  return Boolean(value);
};

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

// Transform raw data based on column mappings
export const transformData = (data: EmployeeData[], mappings: ColumnMapping[]): EmployeeData[] => {
  console.log("Transforming data with mappings:", mappings);
  
  // First check if we have any data to transform
  if (!data || data.length === 0) {
    return [];
  }
  
  const results = data.map(row => {
    const transformedRow: EmployeeData = {};
    
    mappings.forEach(mapping => {
      if (mapping.targetField && row[mapping.sourceColumn] !== undefined) {
        // Handle date fields specifically
        if (mapping.targetField === 'date_of_birth' || mapping.targetField === 'hire_date') {
          const dateValue = row[mapping.sourceColumn];
          const isoDate = excelDateToISO(dateValue);
          transformedRow[mapping.targetField] = isoDate;
        } 
        // Handle rate fields to ensure they're numeric
        else if (mapping.targetField === 'rate_2' || mapping.targetField === 'rate_3' || mapping.targetField === 'rate_4' || 
                 mapping.targetField === 'hourly_rate') {
          const rateValue = row[mapping.sourceColumn];
          if (rateValue !== undefined && rateValue !== null && rateValue !== '') {
            // Parse rate as number
            transformedRow[mapping.targetField] = Number(rateValue);
          }
        }
        // Handle time fields
        else if (mapping.targetField.endsWith('_start_time') || mapping.targetField.endsWith('_end_time')) {
          transformedRow[mapping.targetField] = normalizeTimeString(row[mapping.sourceColumn]);
        }
        // Handle work pattern boolean fields
        else if (mapping.targetField.endsWith('_working')) {
          transformedRow[mapping.targetField] = parseBooleanValue(row[mapping.sourceColumn]);
        }
        else {
          transformedRow[mapping.targetField] = row[mapping.sourceColumn];
        }
      }
    });
    
    // Set default values for missing fields
    if (!transformedRow.hours_per_week) transformedRow.hours_per_week = 40;
    if (!transformedRow.hourly_rate) transformedRow.hourly_rate = 0;
    
    // Convert numeric fields
    if (transformedRow.hours_per_week) transformedRow.hours_per_week = Number(transformedRow.hours_per_week);
    if (transformedRow.hourly_rate) transformedRow.hourly_rate = Number(transformedRow.hourly_rate);
    
    // Extract work pattern data from the transformed row
    // This looks for any work pattern field that was mapped
    const hasWorkPatternFields = mappings.some(mapping => 
      mapping.targetField && (
        mapping.targetField.endsWith('_working') ||
        mapping.targetField.endsWith('_start_time') || 
        mapping.targetField.endsWith('_end_time')
      ) &&
      mapping.sourceColumn && row[mapping.sourceColumn] !== undefined
    );
    
    if (hasWorkPatternFields) {
      transformedRow.work_pattern = JSON.stringify(extractWorkPattern(transformedRow));
    }
    
    return transformedRow;
  });
  
  // Filter out rows without required fields
  return results.filter(row => 
    requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field] !== '')
  );
};

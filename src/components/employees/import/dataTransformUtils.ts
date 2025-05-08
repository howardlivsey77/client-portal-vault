
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

// Extract work pattern data from an employee record
export const extractWorkPattern = (row: EmployeeData): WorkDay[] => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return days.map(day => {
    const isWorkingField = `${day}_working`;
    const startTimeField = `${day}_start_time`;
    const endTimeField = `${day}_end_time`;
    
    // Default to true for isWorking if the field is not present
    // We'll interpret any value that's not explicitly "false", "no", "0" as true
    let isWorking = true;
    if (row[isWorkingField] !== undefined) {
      const workingValue = String(row[isWorkingField]).toLowerCase();
      isWorking = !(workingValue === 'false' || workingValue === 'no' || workingValue === '0' || workingValue === '');
    }
    
    return {
      day: day.charAt(0).toUpperCase() + day.slice(1),
      isWorking,
      startTime: row[startTimeField] || null,
      endTime: row[endTimeField] || null
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
    
    // Extract work pattern data if any work pattern fields are present
    const hasWorkPatternData = Object.keys(row).some(key => 
      key.includes('_working') || key.includes('_start_time') || key.includes('_end_time')
    );
    
    if (hasWorkPatternData) {
      transformedRow.work_pattern = JSON.stringify(extractWorkPattern(row));
    }
    
    return transformedRow;
  });
  
  console.log("Transformed rows:", results);
  
  // Filter out rows without required fields
  return results.filter(row => 
    requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field] !== '')
  );
};

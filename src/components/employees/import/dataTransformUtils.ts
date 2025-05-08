
import { EmployeeData, ColumnMapping, requiredFields } from "./ImportConstants";
import { excelDateToISO } from "./utils/dateUtils";
import { normalizeTimeString } from "./utils/timeUtils";
import { parseBooleanValue } from "./utils/booleanUtils";
import { extractWorkPattern } from "./utils/workPatternUtils";

// Re-export utility functions for backward compatibility
export { excelDateToISO } from "./utils/dateUtils";
export { normalizeTimeString } from "./utils/timeUtils";
export { parseBooleanValue } from "./utils/booleanUtils";
export { extractWorkPattern } from "./utils/workPatternUtils";

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

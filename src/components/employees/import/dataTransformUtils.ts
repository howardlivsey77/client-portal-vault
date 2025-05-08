
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

// Handle splitting full names when only a full name field is provided
const splitFullName = (fullName: string): { firstName: string, lastName: string } => {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  
  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');
  return { firstName, lastName };
};

// Transform raw data based on column mappings
export const transformData = (data: EmployeeData[], mappings: ColumnMapping[]): EmployeeData[] => {
  console.log("Transforming data with mappings:", mappings);
  
  // First check if we have any data to transform
  if (!data || data.length === 0) {
    console.log("No data to transform");
    return [];
  }
  
  const results = data.map(row => {
    const transformedRow: EmployeeData = {};
    const workPatternFields: EmployeeData = {};
    
    // Check if there's an "employee name" or full name column but no separate first/last name
    const hasFirstName = mappings.some(m => m.targetField === 'first_name');
    const hasLastName = mappings.some(m => m.targetField === 'last_name');
    const fullNameMapping = mappings.find(m => 
      (m.sourceColumn.toLowerCase().includes('employee name') || 
       m.sourceColumn.toLowerCase() === 'name') && 
      row[m.sourceColumn] !== undefined
    );
    
    // If there's a full name column but no separate first/last name mappings
    if (fullNameMapping && (!hasFirstName || !hasLastName)) {
      const fullName = String(row[fullNameMapping.sourceColumn]);
      const { firstName, lastName } = splitFullName(fullName);
      
      if (!hasFirstName) transformedRow['first_name'] = firstName;
      if (!hasLastName) transformedRow['last_name'] = lastName;
    }
    
    // Process all mapped columns
    mappings.forEach(mapping => {
      if (mapping.targetField && row[mapping.sourceColumn] !== undefined) {
        const sourceValue = row[mapping.sourceColumn];
        
        // Skip empty values except for boolean fields which could legitimately be false
        if (sourceValue === null || sourceValue === '' && !mapping.targetField.endsWith('_working')) {
          return;
        }
        
        // Handle date fields specifically
        if (mapping.targetField === 'date_of_birth' || mapping.targetField === 'hire_date') {
          const isoDate = excelDateToISO(sourceValue);
          if (isoDate) {
            transformedRow[mapping.targetField] = isoDate;
          }
        } 
        // Handle rate fields to ensure they're numeric
        else if (mapping.targetField === 'rate_2' || mapping.targetField === 'rate_3' || mapping.targetField === 'rate_4' || 
                 mapping.targetField === 'hourly_rate' || mapping.targetField === 'hours_per_week') {
          if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
            // Parse rate as number, handle strings that might have currency symbols
            const numericValue = typeof sourceValue === 'string' 
              ? parseFloat(sourceValue.replace(/[^0-9.-]+/g, ''))
              : Number(sourceValue);
            
            if (!isNaN(numericValue)) {
              transformedRow[mapping.targetField] = numericValue;
            }
          }
        }
        // Handle time fields - store these in workPatternFields object instead of transformedRow
        else if (mapping.targetField.endsWith('_start_time') || mapping.targetField.endsWith('_end_time')) {
          const normalizedTime = normalizeTimeString(sourceValue);
          if (normalizedTime) {
            workPatternFields[mapping.targetField] = normalizedTime;
          }
        }
        // Handle work pattern boolean fields - store these in workPatternFields object
        else if (mapping.targetField.endsWith('_working')) {
          workPatternFields[mapping.targetField] = parseBooleanValue(sourceValue);
        }
        else {
          // For text fields, ensure we're not storing undefined or null
          transformedRow[mapping.targetField] = sourceValue !== null && sourceValue !== undefined ? String(sourceValue) : '';
        }
      }
    });
    
    // Set default values for missing fields
    if (!transformedRow.hours_per_week && transformedRow.hours_per_week !== 0) transformedRow.hours_per_week = 40;
    if (!transformedRow.hourly_rate && transformedRow.hourly_rate !== 0) transformedRow.hourly_rate = 0;
    
    // Add work pattern fields to transformed row if any exist
    if (Object.keys(workPatternFields).length > 0) {
      Object.assign(transformedRow, workPatternFields);
      
      // Also create the work_pattern JSON string for backward compatibility
      const workPattern = extractWorkPattern(workPatternFields);
      if (workPattern.length > 0) {
        transformedRow.work_pattern = JSON.stringify(workPattern);
      }
    }
    
    return transformedRow;
  });
  
  // Log data before and after validation for debugging
  console.log("Before validation - sample row:", results[0]);
  
  // Filter out rows without required fields and log helpful info
  const validRows = results.filter(row => 
    requiredFields.every(field => {
      const hasField = row[field] !== undefined && row[field] !== null && row[field] !== '';
      if (!hasField) {
        console.log(`Missing required field ${field} in row:`, row);
      }
      return hasField;
    })
  );
  
  console.log(`Data transformation complete: ${validRows.length} valid rows out of ${results.length} total`);
  if (validRows.length === 0) {
    console.log("No valid rows found. Sample row from raw data:", data[0]);
    console.log("Sample transformed row before filtering:", results[0]);
  }
  
  return validRows;
};

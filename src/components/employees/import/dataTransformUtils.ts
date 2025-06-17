
import { EmployeeData, ColumnMapping, requiredFields } from "./ImportConstants";

// Helper function to convert Excel numeric dates to ISO date strings
export const excelDateToISO = (excelDate: number | string): string | null => {
  // Handle null, undefined, or empty values
  if (excelDate === null || excelDate === undefined || excelDate === '') {
    return null;
  }
  
  try {
    // If it's already a string and looks like a date string, validate and return it
    if (typeof excelDate === 'string') {
      // Check for common date formats
      if (/^\d{4}-\d{2}-\d{2}/.test(excelDate) || 
          /^\d{2}\/\d{2}\/\d{4}/.test(excelDate) ||
          /^\d{2}\.\d{2}\.\d{4}/.test(excelDate)) {
        const parsedDate = new Date(excelDate);
        // Check if the date is valid
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      }
      
      // Try to parse as a number if it's a string representation of a number
      const numericValue = parseFloat(excelDate);
      if (!isNaN(numericValue)) {
        return excelDateToISO(numericValue);
      }
      
      console.warn('Invalid date string format:', excelDate);
      return null;
    }
    
    // If it's a number, treat it as an Excel date
    if (typeof excelDate === 'number') {
      // Validate the number is reasonable for an Excel date
      if (excelDate < 1 || excelDate > 100000) {
        console.warn('Invalid Excel date number:', excelDate);
        return null;
      }
      
      // Excel's epoch starts on 1900-01-01, but Excel incorrectly assumes 1900 is a leap year
      // So we need to adjust dates after February 28, 1900
      // Excel date 60 corresponds to February 29, 1900 which doesn't exist
      const adjustedExcelDate = excelDate > 60 ? excelDate - 1 : excelDate;
      
      // Convert Excel date to JavaScript date
      // Excel epoch is December 31, 1899
      const msPerDay = 24 * 60 * 60 * 1000;
      const jsDate = new Date(Date.UTC(1899, 11, 30) + (adjustedExcelDate * msPerDay));
      
      // Validate the resulting date
      if (isNaN(jsDate.getTime())) {
        console.warn('Invalid date result from Excel conversion:', excelDate);
        return null;
      }
      
      return jsDate.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Error converting date:', excelDate, error);
    return null;
  }
  
  console.warn('Unhandled date type:', typeof excelDate, excelDate);
  return null;
};

// Transform raw data based on column mappings
export const transformData = (data: EmployeeData[], mappings: ColumnMapping[]): EmployeeData[] => {
  console.log("Transforming data with mappings:", mappings);
  
  // First check if we have any data to transform
  if (!data || data.length === 0) {
    console.log("No data to transform");
    return [];
  }
  
  const results = data.map((row, index) => {
    const transformedRow: EmployeeData = {};
    
    mappings.forEach(mapping => {
      if (mapping.targetField && row[mapping.sourceColumn] !== undefined) {
        const sourceValue = row[mapping.sourceColumn];
        
        // Handle date fields specifically
        if (mapping.targetField === 'date_of_birth' || mapping.targetField === 'hire_date') {
          const isoDate = excelDateToISO(sourceValue);
          if (isoDate) {
            transformedRow[mapping.targetField] = isoDate;
          } else {
            console.log(`Skipping invalid date for ${mapping.targetField} in row ${index + 1}:`, sourceValue);
            // Don't set the field if date conversion failed
          }
        } 
        // Handle rate fields to ensure they're numeric
        else if (mapping.targetField === 'rate_2' || mapping.targetField === 'rate_3' || mapping.targetField === 'rate_4' || 
                 mapping.targetField === 'hourly_rate') {
          if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
            const numericValue = Number(sourceValue);
            if (!isNaN(numericValue)) {
              transformedRow[mapping.targetField] = numericValue;
            } else {
              console.log(`Invalid numeric value for ${mapping.targetField} in row ${index + 1}:`, sourceValue);
            }
          }
        }
        else {
          // For all other fields, just copy the value
          transformedRow[mapping.targetField] = sourceValue;
        }
      }
    });
    
    // Set default values for missing fields
    if (!transformedRow.hours_per_week) transformedRow.hours_per_week = 40;
    if (!transformedRow.hourly_rate) transformedRow.hourly_rate = 0;
    
    // Convert numeric fields with validation
    if (transformedRow.hours_per_week) {
      const hours = Number(transformedRow.hours_per_week);
      transformedRow.hours_per_week = isNaN(hours) ? 40 : hours;
    }
    if (transformedRow.hourly_rate) {
      const rate = Number(transformedRow.hourly_rate);
      transformedRow.hourly_rate = isNaN(rate) ? 0 : rate;
    }
    
    return transformedRow;
  });
  
  console.log("Transformed rows:", results);
  
  // Filter out rows without required fields
  const validResults = results.filter(row => {
    const hasRequiredFields = requiredFields.every(field => 
      row[field] !== undefined && row[field] !== null && row[field] !== ''
    );
    
    if (!hasRequiredFields) {
      console.log("Row missing required fields:", row);
    }
    
    return hasRequiredFields;
  });
  
  console.log(`Filtered from ${results.length} to ${validResults.length} valid rows`);
  
  return validResults;
};

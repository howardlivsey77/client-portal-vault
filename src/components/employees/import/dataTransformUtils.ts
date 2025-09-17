import { EmployeeData, ColumnMapping, requiredFields } from "./ImportConstants";
import { 
  validateNationalInsuranceNumber, 
  normalizeNationalInsuranceNumber,
  validateNicCode,
  normalizeNicCode
} from "./validationUtils";

// Helper function to parse DD/MM/YYYY format dates from CSV files
export const parseCSVDate = (dateValue: string | number): string | null => {
  // Handle null, undefined, or empty values
  if (dateValue === null || dateValue === undefined || dateValue === '') {
    return null;
  }
  
  try {
    // Convert to string if it's a number
    const dateString = String(dateValue).trim();
    
    // Check if it matches DD/MM/YYYY format
    const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(ddmmyyyyPattern);
    
    if (match) {
      const [, day, month, year] = match;
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      // Validate date components
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
        console.warn('Invalid date components in DD/MM/YYYY format:', dateString);
        return null;
      }
      
      // Create date using year, month-1 (0-indexed), day
      const jsDate = new Date(yearNum, monthNum - 1, dayNum);
      
      // Validate that the date is valid (handles leap years, etc.)
      if (jsDate.getFullYear() !== yearNum || jsDate.getMonth() !== monthNum - 1 || jsDate.getDate() !== dayNum) {
        console.warn('Invalid date created from DD/MM/YYYY format:', dateString);
        return null;
      }
      
      // Return ISO date string
      const isoDate = jsDate.toISOString().split('T')[0];
      console.log(`CSV date parsed: "${dateString}" -> "${isoDate}"`);
      return isoDate;
    }
    
    // If it doesn't match DD/MM/YYYY, try other common formats
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      // Already in ISO format
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
    
    console.warn('Date string does not match expected DD/MM/YYYY format:', dateString);
    return null;
  } catch (error) {
    console.error('Error parsing CSV date:', dateValue, error);
    return null;
  }
};

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
export const transformData = (data: EmployeeData[], mappings: ColumnMapping[], isCSVFile: boolean = false): EmployeeData[] => {
  console.log("Transforming data with mappings:", mappings);
  console.log("File type is CSV:", isCSVFile);
  
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
        
        // Handle payroll_id specifically to ensure proper normalization
        if (mapping.targetField === 'payroll_id') {
          if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
            // Convert to string and trim, ensuring we handle numeric values properly
            const stringValue = String(sourceValue).trim();
            if (stringValue !== '') {
              transformedRow[mapping.targetField] = stringValue;
              console.log(`Row ${index + 1}: payroll_id "${sourceValue}" -> "${stringValue}"`);
            } else {
              console.log(`Row ${index + 1}: payroll_id is empty after trimming, skipping`);
            }
          } else {
            console.log(`Row ${index + 1}: payroll_id is null/undefined/empty, skipping`);
          }
        }
        // Handle National Insurance Number validation and normalization
        else if (mapping.targetField === 'national_insurance_number') {
          if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
            const normalizedNI = normalizeNationalInsuranceNumber(String(sourceValue));
            if (normalizedNI) {
              transformedRow[mapping.targetField] = normalizedNI;
              console.log(`Row ${index + 1}: national_insurance_number "${sourceValue}" -> "${normalizedNI}"`);
            } else {
              console.log(`Row ${index + 1}: Invalid National Insurance Number format: "${sourceValue}"`);
              // Don't set the field if validation failed
            }
          }
        }
        // Handle NIC Code validation and normalization
        else if (mapping.targetField === 'nic_code') {
          if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
            const normalizedNIC = normalizeNicCode(String(sourceValue));
            if (normalizedNIC) {
              transformedRow[mapping.targetField] = normalizedNIC;
              console.log(`Row ${index + 1}: nic_code "${sourceValue}" -> "${normalizedNIC}"`);
            } else {
              console.log(`Row ${index + 1}: Invalid NIC Code: "${sourceValue}"`);
              // Don't set the field if validation failed
            }
          }
        }
        // Handle date fields specifically based on file type
        else if (mapping.targetField === 'date_of_birth' || mapping.targetField === 'hire_date' || mapping.targetField === 'leave_date') {
          let isoDate: string | null = null;
          
          if (isCSVFile) {
            // Use CSV date parser for DD/MM/YYYY format
            isoDate = parseCSVDate(sourceValue);
            console.log(`CSV date conversion for ${mapping.targetField} in row ${index + 1}: "${sourceValue}" -> "${isoDate}"`);
          } else {
            // Use Excel date parser for Excel files
            isoDate = excelDateToISO(sourceValue);
            console.log(`Excel date conversion for ${mapping.targetField} in row ${index + 1}: "${sourceValue}" -> "${isoDate}"`);
          }
          
          if (isoDate) {
            transformedRow[mapping.targetField] = isoDate;
          } else {
            console.log(`Skipping invalid date for ${mapping.targetField} in row ${index + 1}:`, sourceValue);
            // Don't set the field if date conversion failed - let database handle defaults
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
    // Set default department if not provided
    if (!transformedRow.department) transformedRow.department = 'General';
    
    // Auto-determine status based on leave_date if not explicitly set
    if (!transformedRow.status && transformedRow.leave_date) {
      const leaveDate = new Date(transformedRow.leave_date);
      const today = new Date();
      transformedRow.status = leaveDate <= today ? 'leaver' : 'active';
      console.log(`Row ${index + 1}: Auto-set status to "${transformedRow.status}" based on leave_date "${transformedRow.leave_date}"`);
    } else if (!transformedRow.status) {
      transformedRow.status = 'active';
    }
    
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

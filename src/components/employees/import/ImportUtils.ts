
import * as XLSX from "xlsx";
import { EmployeeData, ColumnMapping, availableFields, requiredFields } from "./ImportConstants";

// Read and parse file data
export const readFileData = async (file: File): Promise<{data: EmployeeData[], headers: string[]}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject("No data found in file");
          return;
        }
        
        let parsedData: EmployeeData[] = [];
        let headers: string[] = [];
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV using XLSX
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
          
          // Extract headers
          if (parsedData.length > 0) {
            headers = Object.keys(parsedData[0]);
          }
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Parse Excel
          const binary = new Uint8Array(data as ArrayBuffer);
          const workbook = XLSX.read(binary, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
          
          // Extract headers
          if (parsedData.length > 0) {
            headers = Object.keys(parsedData[0]);
          }
        } else {
          reject("Unsupported file format");
          return;
        }
        
        resolve({
          data: parsedData,
          headers: headers
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    
    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

// Automatically map columns based on similarity
export const autoMapColumns = (headers: string[]): ColumnMapping[] => {
  // Try to load saved mappings first
  const savedMappings = loadSavedMappings();
  
  // If we have saved mappings that match our headers, use those
  if (savedMappings && headers.every(header => 
    savedMappings.some(mapping => mapping.sourceColumn === header)
  )) {
    return savedMappings;
  }
  
  // Otherwise, perform auto-mapping
  return headers.map(header => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Try to find an exact match first
    const exactMatch = availableFields.find(field => 
      field.toLowerCase() === header.toLowerCase()
    );
    
    if (exactMatch) {
      return { sourceColumn: header, targetField: exactMatch };
    }
    
    // Then try to find a partial match
    for (const field of availableFields) {
      const normalizedField = field.toLowerCase();
      if (normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)) {
        return { sourceColumn: header, targetField: field };
      }
    }
    
    // Check if we have a saved mapping for this header
    const savedMapping = savedMappings?.find(mapping => mapping.sourceColumn === header);
    if (savedMapping) {
      return savedMapping;
    }
    
    // No match found
    return { sourceColumn: header, targetField: null };
  });
};

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

// Transform raw data based on column mappings
export const transformData = (data: EmployeeData[], mappings: ColumnMapping[]): EmployeeData[] => {
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
        } else {
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
    
    return transformedRow;
  });
  
  // Filter out rows without required fields
  return results.filter(row => 
    requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field] !== '')
  );
};

// Check if all required fields are mapped
export const areRequiredFieldsMapped = (columnMappings: ColumnMapping[]): boolean => {
  // Check if every required field has at least one column mapped to it
  return requiredFields.every(requiredField => 
    columnMappings.some(mapping => mapping.targetField === requiredField)
  );
};

// Save column mappings to localStorage
export const saveMappings = (mappings: ColumnMapping[]): void => {
  try {
    localStorage.setItem('employeeImportMappings', JSON.stringify(mappings));
  } catch (error) {
    console.error("Failed to save column mappings:", error);
  }
};

// Load saved column mappings from localStorage
export const loadSavedMappings = (): ColumnMapping[] | null => {
  try {
    const savedMappings = localStorage.getItem('employeeImportMappings');
    return savedMappings ? JSON.parse(savedMappings) : null;
  } catch (error) {
    console.error("Failed to load saved column mappings:", error);
    return null;
  }
};

// Clear saved mappings
export const clearSavedMappings = (): void => {
  try {
    localStorage.removeItem('employeeImportMappings');
  } catch (error) {
    console.error("Failed to clear saved column mappings:", error);
  }
};

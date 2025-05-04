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
    console.log("Using saved mappings");
    return savedMappings;
  }
  
  console.log("Auto-mapping columns");
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

// Transform raw data based on column mappings
export const transformData = (data: EmployeeData[], mappings: ColumnMapping[]): EmployeeData[] => {
  console.log("Transforming data with mappings:", { dataLength: data.length, mappings });
  
  if (!data || data.length === 0) {
    console.warn("No data to transform");
    return [];
  }
  
  const transformedData = data.map(row => {
    const transformedRow: EmployeeData = {};
    
    mappings.forEach(mapping => {
      if (mapping.targetField && row[mapping.sourceColumn] !== undefined) {
        transformedRow[mapping.targetField] = row[mapping.sourceColumn];
      }
    });
    
    // Set default values for missing fields
    if (!transformedRow.hours_per_week) transformedRow.hours_per_week = 40;
    if (!transformedRow.hourly_rate) transformedRow.hourly_rate = 0;
    
    // Convert numeric fields
    if (transformedRow.salary) transformedRow.salary = Number(transformedRow.salary);
    if (transformedRow.hours_per_week) transformedRow.hours_per_week = Number(transformedRow.hours_per_week);
    if (transformedRow.hourly_rate) transformedRow.hourly_rate = Number(transformedRow.hourly_rate);
    
    return transformedRow;
  }).filter(row => {
    // Filter out rows without required fields
    const hasRequiredFields = requiredFields.every(field => 
      row[field] !== undefined && row[field] !== null && row[field] !== ''
    );
    
    if (!hasRequiredFields) {
      console.warn("Row missing required fields:", row);
    }
    
    return hasRequiredFields;
  });
  
  console.log(`Transformed ${transformedData.length} rows out of ${data.length}`);
  return transformedData;
};

// Check if all required fields are mapped
export const areRequiredFieldsMapped = (columnMappings: ColumnMapping[]): boolean => {
  const result = requiredFields.every(field => 
    columnMappings.some(mapping => mapping.targetField === field)
  );
  
  console.log("Required fields mapped:", result);
  return result;
};

// Save column mappings to localStorage
export const saveMappings = (mappings: ColumnMapping[]): void => {
  try {
    localStorage.setItem('employeeImportMappings', JSON.stringify(mappings));
    console.log("Saved mappings to localStorage:", mappings);
  } catch (error) {
    console.error("Failed to save column mappings:", error);
  }
};

// Load saved column mappings from localStorage
export const loadSavedMappings = (): ColumnMapping[] | null => {
  try {
    const savedMappings = localStorage.getItem('employeeImportMappings');
    const parsedMappings = savedMappings ? JSON.parse(savedMappings) : null;
    console.log("Loaded mappings from localStorage:", parsedMappings);
    return parsedMappings;
  } catch (error) {
    console.error("Failed to load saved column mappings:", error);
    return null;
  }
};

// Clear saved mappings
export const clearSavedMappings = (): void => {
  try {
    localStorage.removeItem('employeeImportMappings');
    console.log("Cleared saved mappings from localStorage");
  } catch (error) {
    console.error("Failed to clear saved column mappings:", error);
  }
};


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
    
    // No match found
    return { sourceColumn: header, targetField: null };
  });
};

// Transform raw data based on column mappings
export const transformData = (data: EmployeeData[], mappings: ColumnMapping[]): EmployeeData[] => {
  return data.map(row => {
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
  }).filter(row => 
    // Filter out rows without required fields
    requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field] !== '')
  );
};

// Check if all required fields are mapped
export const areRequiredFieldsMapped = (columnMappings: ColumnMapping[]): boolean => {
  return requiredFields.every(field => 
    columnMappings.some(mapping => mapping.targetField === field)
  );
};

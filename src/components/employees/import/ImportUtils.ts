
import { EmployeeData, ColumnMapping, availableFields, fieldLabels } from "./ImportConstants";
import { transformData as transformDataInternal } from "./dataTransformUtils";

// Re-export the transform function with file type detection
export const transformData = (data: EmployeeData[], mappings: ColumnMapping[], isCSVFile: boolean = false): EmployeeData[] => {
  return transformDataInternal(data, mappings, isCSVFile);
};

// Save column mappings to localStorage for future use
export const saveMappings = (mappings: ColumnMapping[]) => {
  try {
    localStorage.setItem('employeeImportMappings', JSON.stringify(mappings));
    console.log('Column mappings saved to localStorage');
  } catch (error) {
    console.error('Failed to save column mappings:', error);
  }
};

// Load saved column mappings from localStorage
export const loadSavedMappings = (): ColumnMapping[] => {
  try {
    const saved = localStorage.getItem('employeeImportMappings');
    if (saved) {
      const mappings = JSON.parse(saved);
      console.log('Loaded saved column mappings:', mappings);
      return mappings;
    }
  } catch (error) {
    console.error('Failed to load saved column mappings:', error);
  }
  return [];
};

// Automatically map columns based on header names
export const autoMapColumns = (headers: string[]): ColumnMapping[] => {
  const mappings: ColumnMapping[] = [];
  const savedMappings = loadSavedMappings();
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    
    // First check if we have a saved mapping for this header
    const savedMapping = savedMappings.find(m => m.sourceColumn === header);
    if (savedMapping) {
      mappings.push(savedMapping);
      return;
    }
    
    // Auto-detect based on common patterns
    let targetField: string | null = null;
    
    if (normalizedHeader.includes('first') && normalizedHeader.includes('name')) {
      targetField = 'first_name';
    } else if (normalizedHeader.includes('last') && normalizedHeader.includes('name')) {
      targetField = 'last_name';
    } else if (normalizedHeader.includes('surname')) {
      targetField = 'last_name';
    } else if (normalizedHeader.includes('department')) {
      targetField = 'department';
    } else if (normalizedHeader.includes('email')) {
      targetField = 'email';
    } else if (normalizedHeader.includes('payroll') && normalizedHeader.includes('id')) {
      targetField = 'payroll_id';
    } else if (normalizedHeader.includes('hourly') && normalizedHeader.includes('rate')) {
      targetField = 'hourly_rate';
    } else if (normalizedHeader.includes('hours') && normalizedHeader.includes('week')) {
      targetField = 'hours_per_week';
    } else if (normalizedHeader.includes('birth') && normalizedHeader.includes('date')) {
      targetField = 'date_of_birth';
    } else if (normalizedHeader.includes('hire') && normalizedHeader.includes('date')) {
      targetField = 'hire_date';
    } else if (normalizedHeader.includes('start') && normalizedHeader.includes('date')) {
      targetField = 'hire_date';
    } else if (normalizedHeader.includes('address') && normalizedHeader.includes('1')) {
      targetField = 'address1';
    } else if (normalizedHeader.includes('address') && normalizedHeader.includes('2')) {
      targetField = 'address2';
    } else if (normalizedHeader.includes('address') && normalizedHeader.includes('3')) {
      targetField = 'address3';
    } else if (normalizedHeader.includes('address') && normalizedHeader.includes('4')) {
      targetField = 'address4';
    } else if (normalizedHeader.includes('postcode') || normalizedHeader.includes('postal')) {
      targetField = 'postcode';
    } else if (normalizedHeader.includes('gender')) {
      targetField = 'gender';
    } else if (normalizedHeader.includes('rate') && normalizedHeader.includes('2')) {
      targetField = 'rate_2';
    } else if (normalizedHeader.includes('rate') && normalizedHeader.includes('3')) {
      targetField = 'rate_3';
    } else if (normalizedHeader.includes('rate') && normalizedHeader.includes('4')) {
      targetField = 'rate_4';
    }
    
    mappings.push({
      sourceColumn: header,
      targetField: targetField
    });
  });
  
  console.log('Auto-mapped columns:', mappings);
  return mappings;
};

// Re-export from fileParsingUtils
export { readFileData } from "./fileParsingUtils";

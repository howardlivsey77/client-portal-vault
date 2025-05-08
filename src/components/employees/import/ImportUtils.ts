
// Re-export from smaller utility files
export { readFileData } from './fileParsingUtils';
export { 
  autoMapColumns, 
  saveMappings, 
  loadSavedMappings, 
  clearSavedMappings, 
  hasDuplicatePayrollIds 
} from './columnMappingUtils';
export { 
  transformData,
  excelDateToISO,
  normalizeTimeString,
  parseBooleanValue,
  extractWorkPattern 
} from './dataTransformUtils';

// Legacy export to maintain backward compatibility with the original functionality
import { EmployeeData, ColumnMapping } from "./ImportConstants";
import { areRequiredFieldsMapped as checkRequiredFields } from "./utils/mappingValidation";

// Original function for backward compatibility
export const areRequiredFieldsMapped = (columnMappings: ColumnMapping[]): boolean => {
  // Import required fields here to avoid circular dependency
  const requiredFields = ["first_name", "last_name", "department"];
  return checkRequiredFields(columnMappings, requiredFields);
};

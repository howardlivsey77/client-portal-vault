
// Re-export from smaller utility files
export { readFileData } from './fileParsingUtils';
export { autoMapColumns, saveMappings, loadSavedMappings, clearSavedMappings } from './columnMappingUtils';
export { transformData, excelDateToISO } from './dataTransformUtils';

// Legacy export to maintain backward compatibility with the original functionality
import { EmployeeData, ColumnMapping } from "./ImportConstants";
import { areRequiredFieldsMapped as checkRequiredFields } from "./columnMappingUtils";

// Original function for backward compatibility
export const areRequiredFieldsMapped = (columnMappings: ColumnMapping[]): boolean => {
  // Import required fields here to avoid circular dependency
  const requiredFields = ["first_name", "last_name", "department"];
  return checkRequiredFields(columnMappings, requiredFields);
};

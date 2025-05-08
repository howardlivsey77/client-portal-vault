
import { ColumnMapping } from "./ImportConstants";

// Import from utility files
import { autoMapColumns } from "./utils/autoMapper";
import { areRequiredFieldsMapped as checkRequiredFields } from "./utils/mappingValidation";
import { saveMappings, loadSavedMappings, clearSavedMappings } from "./utils/mappingStorage";

// Re-export all functions
export { 
  autoMapColumns,
  saveMappings, 
  loadSavedMappings, 
  clearSavedMappings 
};

// Original function for backward compatibility
export const areRequiredFieldsMapped = (
  columnMappings: ColumnMapping[], 
  requiredFields: string[] = ['first_name', 'last_name', 'department']
): boolean => {
  return checkRequiredFields(columnMappings, requiredFields);
};

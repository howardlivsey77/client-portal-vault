import { EmployeeData, ColumnMapping, availableFields, fieldLabels } from "./ImportConstants";
import { transformData as transformDataInternal } from "./dataTransformUtils";
import { 
  autoMapColumns as autoMapColumnsInternal, 
  saveMappings as saveMappingsInternal, 
  loadSavedMappings as loadSavedMappingsInternal,
  clearSavedMappings as clearSavedMappingsInternal,
  areRequiredFieldsMapped as areRequiredFieldsMappedInternal
} from "./columnMappingUtils";

// Re-export the transform function with file type detection
export const transformData = (data: EmployeeData[], mappings: ColumnMapping[], isCSVFile: boolean = false): EmployeeData[] => {
  return transformDataInternal(data, mappings, isCSVFile);
};

// Re-export column mapping utilities
export const saveMappings = saveMappingsInternal;
export const loadSavedMappings = loadSavedMappingsInternal;
export const clearSavedMappings = clearSavedMappingsInternal;
export const areRequiredFieldsMapped = areRequiredFieldsMappedInternal;
export const autoMapColumns = autoMapColumnsInternal;

// Work pattern extraction utility - placeholder for now since this functionality doesn't exist yet
export const extractWorkPatternWithPayrollId = (employeeData: EmployeeData) => {
  // This is a placeholder function - the actual work pattern extraction logic
  // would need to be implemented based on the specific requirements
  return null;
};

// Re-export from fileParsingUtils
export { readFileData } from "./fileParsingUtils";

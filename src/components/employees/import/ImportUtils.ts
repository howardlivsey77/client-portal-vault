
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

// Add utility function to extract work pattern data with payroll_id
export const extractWorkPatternWithPayrollId = (employeeData: EmployeeData) => {
  // If employee data contains a work_pattern field, use it
  if (employeeData.work_pattern) {
    try {
      const parsedPattern = JSON.parse(employeeData.work_pattern);
      
      // Ensure all days of the week are present
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const patternsByDay = new Map();
      
      // First, add all existing patterns
      parsedPattern.forEach((pattern: any) => {
        patternsByDay.set(pattern.day, pattern);
      });
      
      // Then, ensure all days exist
      const completePattern = daysOfWeek.map(day => {
        return patternsByDay.get(day) || {
          day,
          isWorking: false,
          startTime: null,
          endTime: null
        };
      });
      
      return completePattern;
    } catch (e) {
      console.error("Failed to parse work pattern:", e);
    }
  }
  
  return null;
};


import { ColumnMapping } from "../ImportConstants";

// Check if required fields are mapped
export const areRequiredFieldsMapped = (
  columnMappings: ColumnMapping[], 
  requiredFields: string[] = ['first_name', 'last_name', 'department']
): boolean => {
  return requiredFields.every(requiredField => 
    columnMappings.some(mapping => mapping.targetField === requiredField)
  );
};

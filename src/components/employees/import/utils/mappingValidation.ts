
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

// Check if any employee data has duplicate payroll IDs within the import data
export const hasDuplicatePayrollIds = (importData: any[]): { hasDuplicates: boolean, duplicates: string[] } => {
  if (!importData || importData.length === 0) {
    return { hasDuplicates: false, duplicates: [] };
  }

  // Create a map to track payroll IDs
  const payrollIdMap = new Map<string, number>();
  const duplicates: string[] = [];

  // Check for duplicates in the imported data
  importData.forEach((emp, index) => {
    if (emp.payroll_id && emp.payroll_id.trim() !== '') {
      const normalizedId = emp.payroll_id.trim();
      
      if (payrollIdMap.has(normalizedId)) {
        duplicates.push(normalizedId);
      } else {
        payrollIdMap.set(normalizedId, index);
      }
    }
  });

  return { 
    hasDuplicates: duplicates.length > 0, 
    duplicates: [...new Set(duplicates)] // Deduplicate the list
  };
};

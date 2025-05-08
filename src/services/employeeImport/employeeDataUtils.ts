
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";

// Process and prepare employee updates
export const prepareEmployeeUpdates = (
  imported: EmployeeData
): { employeeUpdates: Record<string, any>, workPatternFields: Record<string, any> } => {
  const employeeUpdates: Record<string, any> = {};
  const workPatternFields: Record<string, any> = {};
  
  // Only include fields that have values in the imported data
  Object.keys(imported).forEach(key => {
    // Skip id and work_pattern JSON string as we'll handle those separately
    if (key === 'id' || key === 'work_pattern') {
      return;
    }
    
    // Skip empty values
    if (imported[key] === undefined || imported[key] === null || imported[key] === '') {
      return;
    }
    
    // Check if this is a work pattern field
    if (key.includes('_working') || key.includes('_start_time') || key.includes('_end_time')) {
      console.log(`Found work pattern field: ${key} = ${imported[key]}`);
      workPatternFields[key] = imported[key];
    } else {
      // For payroll_id, ensure it's trimmed
      if (key === 'payroll_id' && imported[key]) {
        employeeUpdates[key] = imported[key].trim();
      } else {
        employeeUpdates[key] = imported[key];
      }
    }
  });
  
  // Always round numeric fields
  if ('hourly_rate' in employeeUpdates) employeeUpdates.hourly_rate = roundToTwoDecimals(employeeUpdates.hourly_rate);
  if ('rate_2' in employeeUpdates) employeeUpdates.rate_2 = roundToTwoDecimals(employeeUpdates.rate_2);
  if ('rate_3' in employeeUpdates) employeeUpdates.rate_3 = roundToTwoDecimals(employeeUpdates.rate_3);
  if ('rate_4' in employeeUpdates) employeeUpdates.rate_4 = roundToTwoDecimals(employeeUpdates.rate_4);
  
  return { employeeUpdates, workPatternFields };
};

// Extract new payroll IDs that differ from existing ones
export const extractNewPayrollIds = (
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[]
): string[] => {
  return updatedEmployees
    .filter(({ existing, imported }) => 
      imported.payroll_id && 
      imported.payroll_id.trim() !== '' &&
      imported.payroll_id !== existing.payroll_id)
    .map(({ imported }) => imported.payroll_id.trim());
};

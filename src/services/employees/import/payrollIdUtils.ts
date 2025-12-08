
/**
 * Utility functions for handling payroll IDs in employee imports
 */

/**
 * Safely converts a payroll ID to a trimmed string or null
 */
export const normalizePayrollId = (payrollId: any): string | null => {
  if (payrollId === null || payrollId === undefined || payrollId === '') {
    console.log('Normalizing payroll ID: null/undefined/empty ->', null);
    return null;
  }
  
  // Convert to string and trim, handling both numeric and string inputs
  const stringValue = String(payrollId).trim();
  const result = stringValue === '' ? null : stringValue;
  
  console.log('Normalizing payroll ID:', payrollId, '->', result);
  return result;
};

/**
 * Extracts valid payroll IDs from employee data with enhanced debugging
 */
export const extractValidPayrollIds = (employees: any[]): string[] => {
  console.log('Extracting valid payroll IDs from', employees.length, 'employees');
  
  const payrollIds = employees
    .map((emp, index) => {
      const normalized = normalizePayrollId(emp.payroll_id);
      console.log(`Employee ${index}: payroll_id="${emp.payroll_id}" -> normalized="${normalized}"`);
      return normalized;
    })
    .filter(id => id !== null && id !== '') as string[];
  
  console.log('Valid payroll IDs extracted:', payrollIds);
  console.log('Total valid payroll IDs:', payrollIds.length);
  
  return payrollIds;
};

/**
 * Extracts new payroll IDs from updated employees that differ from existing ones
 */
export const extractNewPayrollIds = (updatedEmployees: {existing: any; imported: any}[]): string[] => {
  console.log('Extracting new payroll IDs from', updatedEmployees.length, 'updated employees');
  
  const newPayrollIds = updatedEmployees
    .filter(({ existing, imported }) => {
      const importedPayrollId = normalizePayrollId(imported.payroll_id);
      const existingPayrollId = normalizePayrollId(existing.payroll_id);
      
      const isDifferent = importedPayrollId && 
                         importedPayrollId !== existingPayrollId &&
                         importedPayrollId !== '';
      
      console.log(`Update check - existing: "${existingPayrollId}", imported: "${importedPayrollId}", isDifferent: ${isDifferent}`);
      return isDifferent;
    })
    .map(({ imported }) => normalizePayrollId(imported.payroll_id) as string);
  
  console.log('New payroll IDs from updates:', newPayrollIds);
  return newPayrollIds;
};

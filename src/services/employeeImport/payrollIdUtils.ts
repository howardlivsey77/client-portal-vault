
/**
 * Utility functions for handling payroll IDs in employee imports
 */

/**
 * Safely converts a payroll ID to a trimmed string or null
 */
export const normalizePayrollId = (payrollId: any): string | null => {
  if (payrollId === null || payrollId === undefined || payrollId === '') {
    return null;
  }
  const trimmed = String(payrollId).trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Extracts valid payroll IDs from employee data
 */
export const extractValidPayrollIds = (employees: any[]): string[] => {
  return employees
    .filter(emp => emp.payroll_id !== null && emp.payroll_id !== undefined && emp.payroll_id !== '')
    .map(emp => String(emp.payroll_id).trim())
    .filter(id => id !== '');
};

/**
 * Extracts new payroll IDs from updated employees that differ from existing ones
 */
export const extractNewPayrollIds = (updatedEmployees: {existing: any; imported: any}[]): string[] => {
  return updatedEmployees
    .filter(({ existing, imported }) => {
      const importedPayrollId = normalizePayrollId(imported.payroll_id);
      const existingPayrollId = normalizePayrollId(existing.payroll_id);
      return importedPayrollId && 
             importedPayrollId !== existingPayrollId &&
             importedPayrollId !== '';
    })
    .map(({ imported }) => String(imported.payroll_id).trim());
};


import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { performComprehensiveDuplicateCheck, DuplicateCheckResult } from "@/services/employeeImport/duplicateChecker";
import { EmployeeConflict } from "./enhancedEmployeeMatching";

export interface ImportValidationResult {
  canProceed: boolean;
  duplicateCheckResult: DuplicateCheckResult;
  conflicts: EmployeeConflict[];
  message: string;
}

/**
 * Validate import data before processing - Fixed to properly handle updates
 */
export const validateImportData = async (
  newEmployees: EmployeeData[],
  updatedEmployees: { existing: EmployeeData; imported: EmployeeData }[],
  conflicts: EmployeeConflict[] = []
): Promise<ImportValidationResult> => {
  console.log('Validating import data...');
  console.log(`New employees: ${newEmployees.length}, Updated employees: ${updatedEmployees.length}, Conflicts: ${conflicts.length}`);
  
  // Only check NEW employees for database duplicates
  // Updated employees are expected to have matching records in the database
  const duplicateCheckResult = await performComprehensiveDuplicateCheck(newEmployees);
  
  // Check for internal duplicates in ALL import data (new + updated)
  const allImportData = [
    ...newEmployees,
    ...updatedEmployees.map(update => update.imported)
  ];
  
  // Perform internal duplicate check on all import data
  const { 
    checkDuplicatesInImportData, 
    checkDuplicateEmailsInImportData, 
    checkDuplicateNationalInsuranceNumbersInImportData 
  } = await import("@/services/employeeImport/duplicateChecker");
  
  const payrollIds = allImportData
    .map(emp => emp.payroll_id)
    .filter(id => id && id.trim() !== '');
  
  const emails = allImportData
    .map(emp => emp.email)
    .filter(email => email && email.trim() !== '');
  
  const nationalInsuranceNumbers = allImportData
    .map(emp => emp.national_insurance_number)
    .filter(ni => ni && ni.trim() !== '');
  
  const internalPayrollDuplicates = checkDuplicatesInImportData(payrollIds);
  const internalEmailDuplicates = checkDuplicateEmailsInImportData(emails);
  const internalNiDuplicates = checkDuplicateNationalInsuranceNumbersInImportData(nationalInsuranceNumbers);
  
  // Combine internal duplicates with the database duplicate check results
  const hasInternalDuplicates = internalPayrollDuplicates.length > 0 || 
                               internalEmailDuplicates.length > 0 || 
                               internalNiDuplicates.length > 0;
  
  const combinedDuplicateResult: DuplicateCheckResult = {
    ...duplicateCheckResult,
    hasInternalDuplicates: hasInternalDuplicates || duplicateCheckResult.hasInternalDuplicates,
    internalDuplicates: {
      payrollIds: [...new Set([...internalPayrollDuplicates, ...duplicateCheckResult.internalDuplicates.payrollIds])],
      emails: [...new Set([...internalEmailDuplicates, ...duplicateCheckResult.internalDuplicates.emails])],
      nationalInsuranceNumbers: [...new Set([...internalNiDuplicates, ...duplicateCheckResult.internalDuplicates.nationalInsuranceNumbers])]
    }
  };
  
  // Determine if we can proceed
  const hasBlockingIssues = combinedDuplicateResult.hasInternalDuplicates || 
                           duplicateCheckResult.hasDatabaseDuplicates ||
                           conflicts.length > 0;
  
  let message = '';
  if (combinedDuplicateResult.hasInternalDuplicates) {
    const issues = [];
    if (combinedDuplicateResult.internalDuplicates.payrollIds.length > 0) {
      issues.push(`Duplicate Payroll IDs in import file: ${combinedDuplicateResult.internalDuplicates.payrollIds.join(', ')}`);
    }
    if (combinedDuplicateResult.internalDuplicates.emails.length > 0) {
      issues.push(`Duplicate Emails in import file: ${combinedDuplicateResult.internalDuplicates.emails.join(', ')}`);
    }
    if (combinedDuplicateResult.internalDuplicates.nationalInsuranceNumbers.length > 0) {
      issues.push(`Duplicate National Insurance Numbers in import file: ${combinedDuplicateResult.internalDuplicates.nationalInsuranceNumbers.join(', ')}`);
    }
    message += `${issues.join('; ')}. `;
  }
  
  if (duplicateCheckResult.hasDatabaseDuplicates) {
    const issues = [];
    if (duplicateCheckResult.databaseDuplicates.payrollIds.length > 0) {
      issues.push(`New employees with existing Payroll IDs: ${duplicateCheckResult.databaseDuplicates.payrollIds.join(', ')}`);
    }
    if (duplicateCheckResult.databaseDuplicates.emails.length > 0) {
      issues.push(`New employees with existing Emails: ${duplicateCheckResult.databaseDuplicates.emails.join(', ')}`);
    }
    if (duplicateCheckResult.databaseDuplicates.nationalInsuranceNumbers.length > 0) {
      issues.push(`New employees with existing National Insurance Numbers: ${duplicateCheckResult.databaseDuplicates.nationalInsuranceNumbers.join(', ')}`);
    }
    message += `${issues.join('; ')}. `;
  }
  
  if (conflicts.length > 0) {
    message += `${conflicts.length} employee matching conflicts detected. `;
  }
  
  if (!hasBlockingIssues) {
    message = `Validation passed. Ready to import ${newEmployees.length} new employees and update ${updatedEmployees.length} existing employees.`;
  }
  
  console.log('Validation result:', {
    canProceed: !hasBlockingIssues,
    message,
    duplicateCheckResult: combinedDuplicateResult,
    conflicts
  });
  
  return {
    canProceed: !hasBlockingIssues,
    duplicateCheckResult: combinedDuplicateResult,
    conflicts,
    message
  };
};

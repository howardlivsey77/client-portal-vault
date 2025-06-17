
// Re-export all employee import functionality from the refactored modules
export { 
  checkDuplicatePayrollIds, 
  checkDuplicatesInImportData,
  checkDuplicateEmails,
  checkDuplicateNationalInsuranceNumbers,
  checkDuplicateEmailsInImportData,
  checkDuplicateNationalInsuranceNumbersInImportData,
  performComprehensiveDuplicateCheck,
  type DuplicateCheckResult
} from "./duplicateChecker";
export { createNewEmployees } from "./employeeCreator";
export { updateExistingEmployees } from "./employeeUpdater";
export { normalizePayrollId, extractValidPayrollIds, extractNewPayrollIds } from "./payrollIdUtils";
export { prepareWorkPatterns, prepareWorkPatternsForInsert } from "./workPatternUtils";

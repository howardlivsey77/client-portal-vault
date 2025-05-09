
// Re-export payroll service functions
export { 
  processExtraHoursFile, 
  savePayrollData,
  fetchPayrollPeriods,
  fetchPayrollEmployeeDetails
} from './processExtraHours';

export {
  calculateMonthlyPayroll
} from './payrollCalculator';

// Export calculation functions from their respective files
export {
  calculateMonthlyIncomeTax
} from './calculations/income-tax-sync';

export {
  calculateNationalInsurance
} from './calculations/national-insurance';

export {
  calculateStudentLoan
} from './calculations/student-loan';

export {
  calculatePension
} from './calculations/pension';

export {
  parseTaxCode
} from './utils/tax-code-utils';

// Export tax constants from the constants file instead of payrollCalculator
export {
  TAX_BANDS,
  NI_THRESHOLDS,
  NI_RATES
} from './constants/tax-constants';

// Export types
export type {
  PayrollResult,
  PayrollDetails,
  TaxCode
} from './types';

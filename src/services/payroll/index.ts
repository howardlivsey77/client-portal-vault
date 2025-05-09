
// Re-export payroll service functions
export { 
  processExtraHoursFile, 
  savePayrollData,
  fetchPayrollPeriods,
  fetchPayrollEmployeeDetails
} from './processExtraHours';

export {
  calculateMonthlyPayroll,
  calculateIncomeTax,
  calculateMonthlyIncomeTax,
  calculateNationalInsurance,
  calculateStudentLoan,
  calculatePension,
  parseTaxCode
} from './payrollCalculator';

// Export tax constants from the constants file instead of payrollCalculator
export {
  TAX_BANDS,
  NI_THRESHOLDS,
  NI_RATES
} from './constants/tax-constants';

export type {
  PayrollDetails,
  PayrollResult,
  TaxCode
} from './payrollCalculator';

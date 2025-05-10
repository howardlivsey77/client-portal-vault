
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
  parseTaxCode,
  TAX_BANDS,
  NI_THRESHOLDS,
  NI_RATES
} from './payrollCalculator';

export type {
  PayrollDetails,
  PayrollResult
} from './types';


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

// Export financial year utilities
export {
  getFinancialYearForDate,
  getCurrentPayPeriod,
  generatePayPeriodsForFinancialYear,
  getFinancialYearRange,
  CURRENT_FINANCIAL_YEAR,
  CURRENT_PAY_PERIOD
} from './utils/financial-year-utils';

export type {
  PayPeriod,
  FinancialYear
} from './utils/financial-year-utils';

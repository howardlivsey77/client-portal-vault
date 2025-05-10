
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
  calculateIncomeTaxFromYTD,
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

// Export free pay calculation utility
export { calculateMonthlyFreePayFromTaxCode } from './utils/tax-code-utils';

// Export financial year utilities
export {
  getFinancialYearForDate,
  getCurrentPayPeriod,
  generatePayPeriodsForFinancialYear,
  getFinancialYearRange,
  CURRENT_FINANCIAL_YEAR,
  CURRENT_PAY_PERIOD,
  AVAILABLE_FINANCIAL_YEARS
} from './utils/financial-year-utils';

export type {
  PayPeriod,
  FinancialYear
} from './utils/financial-year-utils';

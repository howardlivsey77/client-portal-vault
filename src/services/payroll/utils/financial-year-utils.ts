
/**
 * Utilities for handling UK financial years and pay periods
 */

// Financial year constants
export const MONTHS_IN_YEAR = 12;
export const FIRST_MONTH_OF_FINANCIAL_YEAR = 3; // 0-based, so 3 = April

// Pay period types
export type PayPeriod = {
  periodNumber: number; // 1-12
  month: number; // 0-11 (JavaScript Date month)
  year: number;
  description: string;
};

export type FinancialYear = {
  startYear: number;
  endYear: number;
  description: string;
  periods: PayPeriod[];
};

/**
 * Get the financial year containing the specified date
 * @param date The date to get the financial year for
 * @returns The financial year object
 */
export function getFinancialYearForDate(date: Date = new Date()): FinancialYear {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // If we're in January-March, we're in the previous year's financial year
  const startYear = month <= FIRST_MONTH_OF_FINANCIAL_YEAR ? year - 1 : year;
  const endYear = startYear + 1;
  
  return {
    startYear,
    endYear,
    description: `${startYear}/${endYear.toString().substring(2)}`,
    periods: generatePayPeriodsForFinancialYear(startYear),
  };
}

/**
 * Get the current pay period
 * @param date The date to get the pay period for
 * @returns The current pay period
 */
export function getCurrentPayPeriod(date: Date = new Date()): PayPeriod {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // Determine which financial year we're in
  const financialYear = getFinancialYearForDate(date);
  
  // Calculate the period number (1-12)
  // April (month 3) is period 1, May is period 2, etc.
  const periodNumber = month >= FIRST_MONTH_OF_FINANCIAL_YEAR + 1
    ? month - FIRST_MONTH_OF_FINANCIAL_YEAR + 1
    : month + MONTHS_IN_YEAR - FIRST_MONTH_OF_FINANCIAL_YEAR + 1;
  
  // Find the period in the financial year
  return financialYear.periods.find(p => p.periodNumber === periodNumber) || generatePayPeriod(periodNumber, month, year);
}

/**
 * Generate all pay periods for a specific financial year
 * @param startYear The starting year of the financial year
 * @returns Array of pay periods for the financial year
 */
export function generatePayPeriodsForFinancialYear(startYear: number): PayPeriod[] {
  const periods: PayPeriod[] = [];
  
  // April (month 3) to March (month 2 of next year)
  for (let i = 0; i < MONTHS_IN_YEAR; i++) {
    const month = (FIRST_MONTH_OF_FINANCIAL_YEAR + 1 + i) % MONTHS_IN_YEAR;
    const year = month >= 0 && month <= FIRST_MONTH_OF_FINANCIAL_YEAR ? startYear + 1 : startYear;
    const periodNumber = i + 1;
    
    periods.push(generatePayPeriod(periodNumber, month, year));
  }
  
  return periods;
}

/**
 * Generate a pay period object
 */
function generatePayPeriod(periodNumber: number, month: number, year: number): PayPeriod {
  const date = new Date(year, month);
  const monthName = date.toLocaleString('en-GB', { month: 'long' });
  
  return {
    periodNumber,
    month,
    year,
    description: `${periodNumber}. ${monthName} ${year}`,
  };
}

/**
 * Get a list of financial years around the current one
 * @param currentYear The center year
 * @param yearsBack Number of years to go back
 * @param yearsForward Number of years to go forward
 * @returns Array of financial years
 */
export function getFinancialYearRange(
  currentYear: number = new Date().getFullYear(),
  yearsBack: number = 2,
  yearsForward: number = 2
): FinancialYear[] {
  const years: FinancialYear[] = [];
  
  for (let i = -yearsBack; i <= yearsForward; i++) {
    const startYear = currentYear + i;
    years.push({
      startYear,
      endYear: startYear + 1,
      description: `${startYear}/${(startYear + 1).toString().substring(2)}`,
      periods: generatePayPeriodsForFinancialYear(startYear),
    });
  }
  
  return years;
}

// Default to the current financial year for 2025
export const CURRENT_FINANCIAL_YEAR = { 
  startYear: 2025, 
  endYear: 2026,
  description: '2025/26',
  periods: generatePayPeriodsForFinancialYear(2025)
};

// Set the current pay period to April 2025 (Period 1)
export const CURRENT_PAY_PERIOD = CURRENT_FINANCIAL_YEAR.periods[0];

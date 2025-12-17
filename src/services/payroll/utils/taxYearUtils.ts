/**
 * Tax Year Utilities
 * 
 * Handles UK tax year calculations correctly:
 * - Tax year runs April 6 to April 5
 * - Format: "2025/26" for tax year starting April 6, 2025
 */

/**
 * Get the current UK tax year based on a reference date
 * Tax year starts on April 6
 * 
 * @param referenceDate Optional date to calculate tax year for (defaults to today)
 * @returns Tax year in format "YYYY/YY" (e.g., "2025/26")
 * 
 * @example
 * // If today is March 15, 2025 -> returns "2024/25"
 * // If today is April 6, 2025 -> returns "2025/26"
 * // If today is July 1, 2025 -> returns "2025/26"
 */
export function getCurrentTaxYear(referenceDate?: Date): string {
  const date = referenceDate ?? new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11 (0 = January, 3 = April)
  const day = date.getDate();
  
  // Tax year starts April 6 (month 3, day 6)
  // Before April 6: tax year is previous year
  // From April 6: tax year is current year
  const isBeforeTaxYearStart = month < 3 || (month === 3 && day < 6);
  
  if (isBeforeTaxYearStart) {
    // We're in the tax year that started in the previous calendar year
    const startYear = year - 1;
    return `${startYear}/${year.toString().substring(2)}`;
  }
  
  // We're in the tax year that started this calendar year
  return `${year}/${(year + 1).toString().substring(2)}`;
}

/**
 * Get the tax period (month number 1-12) within a tax year
 * Period 1 = April, Period 12 = March
 * 
 * @param referenceDate Optional date to calculate period for (defaults to today)
 * @returns Period number 1-12
 */
export function getTaxPeriod(referenceDate?: Date): number {
  const date = referenceDate ?? new Date();
  const month = date.getMonth(); // 0-11
  
  // Convert calendar month to tax period
  // April (3) = Period 1, March (2) = Period 12
  if (month >= 3) {
    return month - 2; // April(3)=1, May(4)=2, ... March(2)=12
  }
  return month + 10; // Jan(0)=10, Feb(1)=11, March(2)=12
}

/**
 * Parse a tax year string and return start/end dates
 * 
 * @param taxYear Tax year in format "YYYY/YY" (e.g., "2025/26")
 * @returns Object with startDate and endDate
 */
export function parseTaxYear(taxYear: string): { startDate: Date; endDate: Date } {
  const startYear = parseInt(taxYear.split('/')[0], 10);
  
  return {
    startDate: new Date(startYear, 3, 6), // April 6
    endDate: new Date(startYear + 1, 3, 5) // April 5 next year
  };
}

/**
 * Validate a tax year string format
 * 
 * @param taxYear String to validate
 * @returns True if valid format "YYYY/YY"
 */
export function isValidTaxYearFormat(taxYear: string): boolean {
  const pattern = /^\d{4}\/\d{2}$/;
  if (!pattern.test(taxYear)) return false;
  
  const [startYear, endYearShort] = taxYear.split('/');
  const expectedEndYear = (parseInt(startYear, 10) + 1).toString().substring(2);
  
  return endYearShort === expectedEndYear;
}

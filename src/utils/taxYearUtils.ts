
/**
 * Utilities for working with UK tax years
 * 
 * In the UK, the tax year runs from April 6 to April 5 of the following year.
 * For example, the 2025-2026 tax year starts on April 6, 2025 and ends on April 5, 2026.
 */

/**
 * Determines the tax year for a given date
 * @param date Date to check
 * @returns The tax year in "YYYY-YYYY" format (e.g., "2025-2026")
 */
export function getTaxYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11 (Jan-Dec)
  const day = date.getDate();
  
  // If date is before April 6th, it's in the previous tax year
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year-1}-${year}`;
  } else {
    return `${year}-${year+1}`;
  }
}

/**
 * Determines the tax year as numbers for a given date
 * @param date Date to check
 * @returns The starting year of the tax year
 */
export function getTaxYearStart(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11 (Jan-Dec)
  const day = date.getDate();
  
  // If date is before April 6th, it's in the previous tax year
  if (month < 3 || (month === 3 && day < 6)) {
    return year - 1;
  } else {
    return year;
  }
}

/**
 * Get the tax period (1-12) for a given date within the tax year
 * Period 1 = April, Period 12 = March of the following year
 * 
 * @param date Date to check
 * @returns Tax period (1-12)
 */
export function getTaxPeriod(date: Date = new Date()): number {
  const month = date.getMonth(); // 0-11 (Jan-Dec)
  
  // Tax periods run April (1) to March (12)
  if (month >= 3) { // April-December
    return month - 2;
  } else { // January-March
    return month + 10;
  }
}

/**
 * Get the start and end dates for a tax year
 * @param taxYear Tax year in "YYYY-YYYY" format or a year number
 * @returns Object containing start and end dates
 */
export function getTaxYearDates(taxYear: string | number): { startDate: Date; endDate: Date } {
  let startYear: number;
  
  if (typeof taxYear === 'string') {
    startYear = parseInt(taxYear.split('-')[0], 10);
  } else {
    startYear = taxYear;
  }
  
  const startDate = new Date(startYear, 3, 6); // April 6th
  const endDate = new Date(startYear + 1, 3, 5); // April 5th next year
  
  return { startDate, endDate };
}

/**
 * Format a date as a tax period string
 * @param date Date to format
 * @returns Period string (e.g., "April 2025 (Period 1)")
 */
export function formatTaxPeriod(date: Date = new Date()): string {
  const period = getTaxPeriod(date);
  const taxYear = getTaxYear(date);
  const monthNames = [
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "January", "February", "March"
  ];
  
  // Get the actual year for this month (might be next calendar year for periods 10-12)
  let year: number;
  if (period <= 9) {
    year = parseInt(taxYear.split('-')[0], 10);
  } else {
    year = parseInt(taxYear.split('-')[1], 10);
  }
  
  return `${monthNames[period-1]} ${year} (Period ${period})`;
}

/**
 * Get all periods in a tax year with their corresponding date ranges
 * @param taxYear Tax year in "YYYY-YYYY" format or starting year
 * @returns Array of period objects
 */
export function getTaxYearPeriods(taxYear: string | number): Array<{
  period: number;
  name: string;
  startDate: Date;
  endDate: Date;
}> {
  let startYear: number;
  
  if (typeof taxYear === 'string') {
    startYear = parseInt(taxYear.split('-')[0], 10);
  } else {
    startYear = taxYear;
  }
  
  const periods = [];
  const monthNames = [
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "January", "February", "March"
  ];
  
  for (let i = 0; i < 12; i++) {
    let year = startYear;
    if (i > 8) { // January, February, March
      year = startYear + 1;
    }
    
    let month = i + 3;
    if (month > 11) {
      month = month - 12;
    }
    
    // Create start date (1st of month)
    const startDate = new Date(year, month, 1);
    
    // Create end date (last day of month)
    const endDate = new Date(year, month + 1, 0);
    
    periods.push({
      period: i + 1,
      name: `${monthNames[i]} ${year}`,
      startDate,
      endDate
    });
  }
  
  return periods;
}

/**
 * Check if a date is in the current tax year
 * @param date Date to check
 * @returns boolean
 */
export function isCurrentTaxYear(date: Date): boolean {
  const currentTaxYear = getTaxYear();
  const dateTaxYear = getTaxYear(date);
  return currentTaxYear === dateTaxYear;
}

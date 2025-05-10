
import { getMonthName } from "@/lib/formatters";

export interface PayPeriod {
  year: number;
  periodNumber: number;
  description: string;
  month: number; // Adding explicit month field
}

export interface FinancialYear {
  year: number;
  description: string;
  periods: PayPeriod[];
}

export const CURRENT_FINANCIAL_YEAR: FinancialYear = getFinancialYearForDate(new Date());
export const CURRENT_PAY_PERIOD: PayPeriod = getCurrentPayPeriod(new Date());

/**
 * Dynamically generates a list of available financial years including the current year
 * and surrounding years (2 years before and 2 years ahead)
 */
export const AVAILABLE_FINANCIAL_YEARS: FinancialYear[] = generateAvailableFinancialYears();

/**
 * Generate available financial years dynamically based on current date
 * Includes current year, 2 years before and 2 years ahead
 */
function generateAvailableFinancialYears(yearsBeforeAfter: number = 2): FinancialYear[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed
  
  // Financial year starts in April
  const currentFinancialYear = currentMonth >= 4 ? currentYear : currentYear - 1;
  
  const years: FinancialYear[] = [];
  
  // Generate financial years (current year, years before and years after)
  for (let i = -yearsBeforeAfter; i <= yearsBeforeAfter; i++) {
    const year = currentFinancialYear + i;
    years.push({
      year,
      description: `${year}/${(year + 1).toString().slice(-2)}`,
      periods: generatePayPeriodsForFinancialYear(year)
    });
  }
  
  return years;
}

export function getFinancialYearForDate(date: Date): FinancialYear {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const year = date.getFullYear();

  // Financial year starts in April
  const financialYear = month >= 4 ? year : year - 1;

  return {
    year: financialYear,
    description: `${financialYear}/${(financialYear + 1).toString().slice(-2)}`,
    periods: generatePayPeriodsForFinancialYear(financialYear)
  };
}

export function getCurrentPayPeriod(date: Date): PayPeriod {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const year = date.getFullYear();
  
  // Determine the financial year
  const financialYear = month >= 4 ? year : year - 1;
  
  // Calculate the period number based on the month
  let periodNumber = month - 3;
  if (periodNumber <= 0) {
    periodNumber += 12; // Adjust for months before April
  }

  const financialYearData = getFinancialYearForDate(date);
  
  // Find the pay period in the financial year
  const payPeriod = financialYearData.periods.find(period => period.periodNumber === periodNumber);

  if (!payPeriod) {
    console.warn(`No pay period found for period number ${periodNumber} in ${financialYearData.description}.`);
    return {
      year: financialYear,
      periodNumber: periodNumber,
      description: `Unknown Period ${periodNumber}`,
      month: month
    };
  }

  return payPeriod;
}

export function generatePayPeriodsForFinancialYear(year: number): PayPeriod[] {
  const periods: PayPeriod[] = [];
  
  // Tax year runs from April to March
  // So April = Period 1, May = Period 2, etc.
  for (let month = 4; month <= 12; month++) {
    periods.push({
      year,
      periodNumber: month - 3, // April (month 4) is period 1
      description: `${getMonthName(month)} ${year}`,
      month
    });
  }
  
  for (let month = 1; month <= 3; month++) {
    periods.push({
      year,
      periodNumber: month + 9, // January (month 1) is period 10
      description: `${getMonthName(month)} ${year + 1}`,
      month
    });
  }
  
  return periods;
}

export function getFinancialYearRange(financialYear: FinancialYear): { startDate: Date, endDate: Date } {
  const startYear = financialYear.year;
  const startDate = new Date(startYear, 3, 6); // April is month 3 (zero-based index)
  const endDate = new Date(startYear + 1, 2, 5);   // March is month 2

  return { startDate, endDate };
}

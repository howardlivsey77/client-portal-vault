
/**
 * Formats a number as currency (GBP)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formats a date to UK format (dd/MM/yyyy)
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
}

/**
 * Rounds a number to 2 decimal places
 */
export function roundToTwoDecimals(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a number as pounds (without the £ symbol)
 */
export function formatPounds(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  const rounded = roundToTwoDecimals(value);
  return rounded.toFixed(2);
}

/**
 * Returns the name of the month for a given month number (1-12)
 */
export function getMonthName(monthNumber: number): string {
  const months = [
    'January', 'February', 'March', 'April', 
    'May', 'June', 'July', 'August', 
    'September', 'October', 'November', 'December'
  ];
  
  // Adjust for 1-based month numbers
  const index = ((monthNumber - 1) % 12 + 12) % 12; // Ensure it's always in range 0-11
  return months[index];
}

/**
 * Calculates length of service from hire date to current date
 * @param hireDate The employee's hire date
 * @returns An object with years and months of service
 */
export function calculateLengthOfService(hireDate: string | Date): { years: number; months: number } {
  const startDate = new Date(hireDate);
  const currentDate = new Date();
  
  let years = currentDate.getFullYear() - startDate.getFullYear();
  let months = currentDate.getMonth() - startDate.getMonth();
  
  // Adjust years and months if needed
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Adjust if the day of month hasn't been reached yet
  if (currentDate.getDate() < startDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  
  return { years, months };
}

/**
 * Formats length of service as a string
 * @param hireDate The employee's hire date
 * @returns A formatted string showing length of service
 */
export function formatLengthOfService(hireDate: string | Date): string {
  const { years, months } = calculateLengthOfService(hireDate);
  
  if (years === 0 && months === 0) return "Less than a month";
  
  const yearText = years === 1 ? "year" : "years";
  const monthText = months === 1 ? "month" : "months";
  
  if (years === 0) return `${months} ${monthText}`;
  if (months === 0) return `${years} ${yearText}`;
  
  return `${years} ${yearText}, ${months} ${monthText}`;
}

/**
 * Calculates monthly salary from hourly rate and hours per week
 * Formula: (hourly_rate × hours_per_week) / 7 × 365 / 12
 * @param hourlyRate The employee's hourly rate
 * @param hoursPerWeek The employee's contracted hours per week
 * @returns The calculated monthly salary rounded to 2 decimal places
 */
export function calculateMonthlySalary(hourlyRate: number, hoursPerWeek: number): number {
  const monthlySalary = (hourlyRate * hoursPerWeek) / 7 * 365 / 12;
  return roundToTwoDecimals(monthlySalary) || 0;
}

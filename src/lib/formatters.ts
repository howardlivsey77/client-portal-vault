
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

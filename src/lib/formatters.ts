
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


/**
 * Utility functions for converting between different data formats for payroll
 */

/**
 * Convert pounds to pence for database storage
 */
export function poundsToPence(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert pence to pounds for application use
 */
export function penceToPounds(amount: number): number {
  return amount / 100;
}

/**
 * Format numeric value to 2 decimal places
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

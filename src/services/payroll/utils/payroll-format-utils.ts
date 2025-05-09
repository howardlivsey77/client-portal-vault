
/**
 * Convert pounds to pence for database storage
 */
export function poundsToPence(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert pence to pounds for display
 */
export function penceToPounds(pence: number): number {
  return Math.round((pence / 100) * 100) / 100;
}

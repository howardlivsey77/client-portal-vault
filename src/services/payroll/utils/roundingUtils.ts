/**
 * HMRC-Compliant Rounding Utilities for Payroll
 * 
 * UK payroll calculations have specific rounding requirements:
 * 
 * 1. TAXABLE PAY: Round DOWN to nearest pound (truncate)
 *    - HMRC requirement for calculating tax due
 *    - Example: £1,234.99 → £1,234
 * 
 * 2. MONETARY AMOUNTS: Round to 2 decimal places
 *    - Standard banker's rounding (half-up)
 *    - Used for tax, NI, pension contributions
 *    - Example: £123.456 → £123.46
 * 
 * 3. DATABASE STORAGE: Convert to pennies (integer)
 *    - Avoid floating point precision issues
 *    - Example: £123.45 → 12345
 * 
 * References:
 * - HMRC PAYE Manual: https://www.gov.uk/hmrc-internal-manuals/paye-manual
 */

/**
 * Round DOWN to nearest pound
 * Required for taxable pay calculations per HMRC
 * 
 * @param amount Amount in pounds
 * @returns Amount rounded down to nearest pound
 * 
 * @example
 * roundDownToNearestPound(1234.99) // Returns 1234
 * roundDownToNearestPound(1234.01) // Returns 1234
 */
export function roundDownToNearestPound(amount: number): number {
  return Math.floor(amount);
}

/**
 * Standard monetary rounding to 2 decimal places
 * Uses half-up rounding (banker's rounding)
 * 
 * @param amount Amount in pounds
 * @returns Amount rounded to 2 decimal places
 * 
 * @example
 * roundToTwoDecimals(123.456) // Returns 123.46
 * roundToTwoDecimals(123.454) // Returns 123.45
 */
export function roundToTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Convert pounds to pennies for database storage
 * Avoids floating point precision issues
 * 
 * @param pounds Amount in pounds
 * @returns Amount in pennies (integer)
 * 
 * @example
 * poundsToPennies(123.45) // Returns 12345
 */
export function poundsToPennies(pounds: number): number {
  return Math.round(pounds * 100);
}

/**
 * Convert pennies to pounds for display
 * 
 * @param pennies Amount in pennies
 * @returns Amount in pounds (2 decimal places)
 * 
 * @example
 * penniesToPounds(12345) // Returns 123.45
 */
export function penniesToPounds(pennies: number): number {
  return roundToTwoDecimals(pennies / 100);
}

/**
 * Round UP to nearest penny
 * Sometimes required for employer contributions
 * 
 * @param amount Amount in pounds
 * @returns Amount rounded up to 2 decimal places
 * 
 * @example
 * roundUpToPenny(123.451) // Returns 123.46
 */
export function roundUpToPenny(amount: number): number {
  return Math.ceil(amount * 100) / 100;
}

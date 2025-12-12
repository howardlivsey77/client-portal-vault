
import { parseTaxCode } from "../utils/tax-code-utils";
import { getIncomeTaxBands, calculateTaxByBands } from "../utils/tax-bands-utils";
import { 
  validateCumulativeInputs, 
  validateWeek1Month1Inputs 
} from "../validation/payroll-validators";
import { CalculationAnomalyError } from "../errors/payroll-errors";

/**
 * Round to two decimal places (local version to avoid null handling)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Check for calculation anomalies that may indicate errors
 * @throws CalculationAnomalyError if anomaly detected
 */
function checkForAnomalies(
  taxThisPeriod: number,
  grossPayThisPeriod: number,
  context: string
): void {
  // Flag if tax exceeds 50% of gross pay (unusual but possible with K codes)
  if (grossPayThisPeriod > 0 && taxThisPeriod > grossPayThisPeriod * 0.5) {
    // Log warning but don't throw - this can be valid for K codes or high earners
    console.warn(
      `[PAYROLL ANOMALY] ${context}: Tax (£${taxThisPeriod.toFixed(2)}) exceeds 50% of gross pay (£${grossPayThisPeriod.toFixed(2)}). ` +
      `This may be correct for K codes or very high earners, but please verify.`
    );
  }
  
  // Flag extremely large refunds (more than £10,000)
  if (taxThisPeriod < -10000) {
    throw new CalculationAnomalyError(
      `Extremely large tax refund of £${Math.abs(taxThisPeriod).toFixed(2)} calculated. ` +
      `This exceeds safety threshold and requires manual review.`,
      { taxThisPeriod, grossPayThisPeriod, context }
    );
  }
}

export interface CumulativeTaxResult {
  taxThisPeriod: number;
  taxDueYTD: number;
  freePayYTD: number;
  taxablePayYTD: number;
}

/**
 * Calculate cumulative tax for a given period using HMRC cumulative basis
 * 
 * This is the correct HMRC method which:
 * 1. Calculates cumulative free pay (monthly allowance × period)
 * 2. Calculates taxable pay YTD (gross pay YTD - free pay YTD)
 * 3. Calculates total tax due YTD using tax bands
 * 4. Tax this period = Tax due YTD - Tax already paid YTD
 * 
 * This method correctly handles refunds when pay decreases or periods have zero pay.
 * 
 * @param period - Tax period (1-12 for monthly)
 * @param grossPayYTD - Gross pay year to date (in pounds)
 * @param taxCode - Employee tax code (e.g., '1257L', 'BR', 'NT', 'K497')
 * @param taxPaidYTD - Tax already paid YTD from previous periods (in pounds)
 * @param taxYear - Optional tax year for fetching correct tax bands
 * @returns Tax calculation result including tax this period (can be negative for refunds)
 * 
 * @throws ZodError if inputs fail validation
 * @throws UnrecognizedTaxCodeError if tax code is not valid
 * @throws UnsupportedTaxRegionError if Scottish/Welsh tax code used
 * @throws CalculationAnomalyError if result exceeds safety thresholds
 */
export async function calculateCumulativeTax(
  period: number,
  grossPayYTD: number,
  taxCode: string,
  taxPaidYTD: number,
  taxYear?: string
): Promise<CumulativeTaxResult> {
  // Validate all inputs upfront
  const validated = validateCumulativeInputs(period, grossPayYTD, taxCode, taxPaidYTD);
  
  // Parse tax code (throws if unrecognized)
  const taxCodeInfo = parseTaxCode(validated.taxCode);
  
  // Handle special tax codes
  if (validated.taxCode === 'NT') {
    // No Tax code - no tax due ever
    return {
      taxThisPeriod: -validated.taxPaidYTD, // Refund any previously paid tax
      taxDueYTD: 0,
      freePayYTD: Infinity,
      taxablePayYTD: 0
    };
  }
  
  // Step 1: Calculate cumulative free pay YTD
  // For K codes, monthlyFreePay is negative (adds to taxable income)
  const freePayYTD = roundToTwoDecimals(taxCodeInfo.monthlyFreePay * validated.period);
  
  // Step 2: Calculate taxable pay YTD (rounded down to nearest pound)
  // For K codes, freePayYTD is negative, so this adds to taxable income
  const taxablePayYTD = Math.max(0, Math.floor(validated.grossPayYTD - freePayYTD));
  
  // Step 3: Get tax bands and calculate total tax due YTD
  const taxBands = await getIncomeTaxBands(taxYear);
  const taxDueYTD = calculateTaxByBands(taxablePayYTD, taxBands);
  
  // Step 4: Tax this period = Tax due YTD - Tax already paid YTD
  // This can be negative (refund) if previous periods overpaid
  const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
  
  // Check for anomalies
  const grossPayThisPeriod = validated.period === 1 
    ? validated.grossPayYTD 
    : validated.grossPayYTD / validated.period;
  checkForAnomalies(taxThisPeriod, grossPayThisPeriod, 'Cumulative calculation');
  
  return {
    taxThisPeriod,
    taxDueYTD: roundToTwoDecimals(taxDueYTD),
    freePayYTD,
    taxablePayYTD
  };
}

/**
 * Synchronous version for backward compatibility
 * Uses default tax bands from constants
 * 
 * @throws ZodError if inputs fail validation
 * @throws UnrecognizedTaxCodeError if tax code is not valid
 * @throws UnsupportedTaxRegionError if Scottish/Welsh tax code used
 */
export function calculateCumulativeTaxSync(
  period: number,
  grossPayYTD: number,
  taxCode: string,
  taxPaidYTD: number
): CumulativeTaxResult {
  // Validate inputs
  const validated = validateCumulativeInputs(period, grossPayYTD, taxCode, taxPaidYTD);
  
  // Parse and validate tax code (throws if invalid)
  const taxCodeInfo = parseTaxCode(validated.taxCode);
  
  // Handle NT code - no tax ever
  if (validated.taxCode === 'NT') {
    return {
      taxThisPeriod: roundToTwoDecimals(-validated.taxPaidYTD),
      taxDueYTD: 0,
      freePayYTD: Infinity,
      taxablePayYTD: 0
    };
  }
  
  // Handle BR code - basic rate (20%) on ALL income, no personal allowance
  if (validated.taxCode === 'BR') {
    const taxablePayYTD = Math.floor(validated.grossPayYTD);
    const taxDueYTD = taxablePayYTD * 0.2;
    const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
    checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'BR cumulative');
    return {
      taxThisPeriod,
      taxDueYTD: roundToTwoDecimals(taxDueYTD),
      freePayYTD: 0,
      taxablePayYTD
    };
  }
  
  // Handle D0 code - higher rate (40%) on ALL income
  if (validated.taxCode === 'D0') {
    const taxablePayYTD = Math.floor(validated.grossPayYTD);
    const taxDueYTD = taxablePayYTD * 0.4;
    const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
    checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'D0 cumulative');
    return {
      taxThisPeriod,
      taxDueYTD: roundToTwoDecimals(taxDueYTD),
      freePayYTD: 0,
      taxablePayYTD
    };
  }
  
  // Handle D1 code - additional rate (45%) on ALL income
  if (validated.taxCode === 'D1') {
    const taxablePayYTD = Math.floor(validated.grossPayYTD);
    const taxDueYTD = taxablePayYTD * 0.45;
    const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
    checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'D1 cumulative');
    return {
      taxThisPeriod,
      taxDueYTD: roundToTwoDecimals(taxDueYTD),
      freePayYTD: 0,
      taxablePayYTD
    };
  }
  
  // Standard cumulative calculation for other codes (1257L, K codes, 0T, etc.)
  const freePayYTD = roundToTwoDecimals(taxCodeInfo.monthlyFreePay * validated.period);
  const taxablePayYTD = Math.max(0, Math.floor(validated.grossPayYTD - freePayYTD));
  
  // Apply tax bands
  let taxDueYTD = 0;
  
  // Basic rate (20%) - first £37,700
  if (taxablePayYTD > 0) {
    const basicRateAmount = Math.min(taxablePayYTD, 37700);
    taxDueYTD += basicRateAmount * 0.2;
  }
  
  // Higher rate (40%) - £37,700 to £125,140
  if (taxablePayYTD > 37700) {
    const higherRateAmount = Math.min(taxablePayYTD - 37700, 125140 - 37700);
    taxDueYTD += higherRateAmount * 0.4;
  }
  
  // Additional rate (45%) - over £125,140
  if (taxablePayYTD > 125140) {
    const additionalRateAmount = taxablePayYTD - 125140;
    taxDueYTD += additionalRateAmount * 0.45;
  }
  
  const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
  
  // Check for anomalies
  checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'Cumulative sync');
  
  return {
    taxThisPeriod,
    taxDueYTD: roundToTwoDecimals(taxDueYTD),
    freePayYTD,
    taxablePayYTD
  };
}

/**
 * Week 1/Month 1 Tax Result
 */
export interface Week1Month1TaxResult {
  taxThisPeriod: number;
  freePayMonthly: number;
  taxablePayThisPeriod: number;
}

/**
 * Calculate tax on Week 1/Month 1 (non-cumulative) basis
 * Each period is treated independently with 1/12th of annual bands
 * 
 * This is used when employee has W1/M1 indicator on their tax code
 * or for emergency tax situations.
 * 
 * @param grossPayThisPeriod - Gross pay this period only (in pounds)
 * @param taxCode - Employee tax code (e.g., '45L', 'BR', 'D0', 'D1')
 * @returns Tax due this period (non-cumulative)
 * 
 * @throws ZodError if inputs fail validation
 * @throws UnrecognizedTaxCodeError if tax code is not valid
 * @throws UnsupportedTaxRegionError if Scottish/Welsh tax code used
 */
export function calculateWeek1Month1Tax(
  grossPayThisPeriod: number,
  taxCode: string
): Week1Month1TaxResult {
  // Validate inputs
  const validated = validateWeek1Month1Inputs(grossPayThisPeriod, taxCode);
  
  // Handle NT code - no tax
  if (validated.taxCode === 'NT') {
    return {
      taxThisPeriod: 0,
      freePayMonthly: Infinity,
      taxablePayThisPeriod: 0
    };
  }
  
  // Handle BR code - basic rate (20%) on ALL income
  if (validated.taxCode === 'BR') {
    const taxablePayThisPeriod = Math.floor(validated.grossPayThisPeriod);
    const taxThisPeriod = roundToTwoDecimals(taxablePayThisPeriod * 0.2);
    checkForAnomalies(taxThisPeriod, validated.grossPayThisPeriod, 'BR W1/M1');
    return {
      taxThisPeriod,
      freePayMonthly: 0,
      taxablePayThisPeriod
    };
  }
  
  // Handle D0 code - higher rate (40%) on ALL income
  if (validated.taxCode === 'D0') {
    const taxablePayThisPeriod = Math.floor(validated.grossPayThisPeriod);
    const taxThisPeriod = roundToTwoDecimals(taxablePayThisPeriod * 0.4);
    checkForAnomalies(taxThisPeriod, validated.grossPayThisPeriod, 'D0 W1/M1');
    return {
      taxThisPeriod,
      freePayMonthly: 0,
      taxablePayThisPeriod
    };
  }
  
  // Handle D1 code - additional rate (45%) on ALL income
  if (validated.taxCode === 'D1') {
    const taxablePayThisPeriod = Math.floor(validated.grossPayThisPeriod);
    const taxThisPeriod = roundToTwoDecimals(taxablePayThisPeriod * 0.45);
    checkForAnomalies(taxThisPeriod, validated.grossPayThisPeriod, 'D1 W1/M1');
    return {
      taxThisPeriod,
      freePayMonthly: 0,
      taxablePayThisPeriod
    };
  }
  
  // Parse tax code for monthly free pay (throws if invalid)
  const taxCodeInfo = parseTaxCode(validated.taxCode);
  const freePayMonthly = taxCodeInfo.monthlyFreePay;
  
  // Calculate taxable pay (rounded down to nearest pound)
  // For K codes, freePayMonthly is negative, so this adds to taxable income
  const taxablePayThisPeriod = Math.max(0, Math.floor(validated.grossPayThisPeriod - freePayMonthly));
  
  // Monthly tax bands (1/12 of annual limits)
  const monthlyBasicLimit = Math.floor(37700 / 12);      // £3,141
  const monthlyHigherLimit = Math.floor(125140 / 12);    // £10,428
  
  let taxThisPeriod = 0;
  
  // Basic rate (20%) - first £3,141 of taxable pay
  if (taxablePayThisPeriod > 0) {
    const basicAmount = Math.min(taxablePayThisPeriod, monthlyBasicLimit);
    taxThisPeriod += basicAmount * 0.2;
  }
  
  // Higher rate (40%) - £3,141 to £10,428
  if (taxablePayThisPeriod > monthlyBasicLimit) {
    const higherAmount = Math.min(taxablePayThisPeriod - monthlyBasicLimit, monthlyHigherLimit - monthlyBasicLimit);
    taxThisPeriod += higherAmount * 0.4;
  }
  
  // Additional rate (45%) - over £10,428
  if (taxablePayThisPeriod > monthlyHigherLimit) {
    const additionalAmount = taxablePayThisPeriod - monthlyHigherLimit;
    taxThisPeriod += additionalAmount * 0.45;
  }
  
  const finalTax = roundToTwoDecimals(taxThisPeriod);
  
  // Check for anomalies
  checkForAnomalies(finalTax, validated.grossPayThisPeriod, 'W1/M1 calculation');
  
  return {
    taxThisPeriod: finalTax,
    freePayMonthly,
    taxablePayThisPeriod
  };
}


import { parseTaxCode } from "../utils/tax-code-utils";
import { getIncomeTaxBands, calculateTaxByBands } from "../utils/tax-bands-utils";
import { 
  validateCumulativeInputs, 
  validateWeek1Month1Inputs 
} from "../validation/payroll-validators";
import { CalculationAnomalyError } from "../errors/payroll-errors";
import { payrollLogger } from "../utils/payrollLogger";
/**
 * =============================================================================
 * HMRC Cumulative & Week 1/Month 1 Tax Calculations
 * =============================================================================
 * 
 * ROUNDING STRATEGY (HMRC-aligned):
 * ---------------------------------
 * This module follows a specific rounding order to match HMRC's methodology:
 * 
 * 1. Free Pay YTD: Rounded to 2 decimal places using roundToTwoDecimals()
 *    Formula: monthlyFreePay × period
 * 
 * 2. Taxable Pay YTD: Rounded DOWN (floored) to nearest whole pound
 *    Formula: Math.floor(grossPayYTD - freePayYTD)
 *    This is per HMRC regulations - taxable pay is always whole pounds.
 * 
 * 3. Tax Due YTD: Calculated at full precision using tax bands
 * 
 * 4. Tax This Period: Rounded to 2 decimal places at OUTPUT only
 *    Formula: roundToTwoDecimals(taxDueYTD - taxPaidYTD)
 * 
 * ⚠️  DO NOT change rounding order without thorough testing against HMRC 
 *     test cases. The current order is validated by the test suite.
 * 
 * TAX CODE HANDLING:
 * ------------------
 * - Standard codes (1257L, etc.): Parsed via parseTaxCode() → positive monthlyFreePay
 * - K codes (K497, etc.): Parsed via parseTaxCode() → NEGATIVE monthlyFreePay
 *   → This correctly ADDS to taxable income rather than reducing it
 *   → Taxable pay clamping to 0 is SKIPPED for K codes
 * - Special codes (BR, D0, D1): Handled with explicit branches, flat rates applied
 * - Emergency code (0T): Handled EXPLICITLY in parseTaxCode() → returns 0 allowance
 *   → Falls through to standard banded calculation with 0 free pay
 *   → See tax-code-utils.ts for explicit 0T handling
 * - No Tax (NT): Returns 0 tax due and refunds any previously paid tax
 * 
 * DEPENDENCIES:
 * -------------
 * - parseTaxCode() from tax-code-utils.ts handles ALL tax code parsing
 * - 0T behavior is deterministic: parseTaxCode('0T') → { allowance: 0, monthlyFreePay: 0 }
 * - This module relies on parseTaxCode returning correct values for edge cases
 */

/**
 * Round to two decimal places (local version to avoid null handling)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Options for anomaly checking
 */
interface AnomalyCheckOptions {
  taxCode?: string;
  isActualPeriodGross: boolean;
}

/**
 * Check for calculation anomalies that may indicate errors
 * 
 * Only flags percentage-based warnings when:
 * - Tax is positive (not a refund)
 * - Gross is known to be actual (not estimated)
 * - Not a flat-rate code (BR/D0/D1) or K code
 * 
 * @throws CalculationAnomalyError if anomaly detected (extreme refund)
 */
function checkForAnomalies(
  taxThisPeriod: number,
  grossPayThisPeriod: number,
  context: string,
  options: AnomalyCheckOptions = { isActualPeriodGross: false }
): void {
  const upperTaxCode = options.taxCode?.toUpperCase() ?? '';
  const isHighRateCode = ['BR', 'D0', 'D1'].includes(upperTaxCode);
  const isKCode = upperTaxCode.startsWith('K');
  
  // Only check % threshold if:
  // 1. Tax is positive (not a refund)
  // 2. Gross is known to be actual (not estimated)
  // 3. Not a flat-rate code (BR/D0/D1) or K code
  // 4. Using 60% threshold (more permissive than 50%)
  if (
    options.isActualPeriodGross &&
    !isHighRateCode &&
    !isKCode &&
    grossPayThisPeriod > 0 &&
    taxThisPeriod > 0 &&
    taxThisPeriod > grossPayThisPeriod * 0.6
  ) {
    payrollLogger.warn(
      `${context}: Tax (£${taxThisPeriod.toFixed(2)}) exceeds 60% of gross pay (£${grossPayThisPeriod.toFixed(2)}). Please verify.`,
      { employeeId: 'unknown' },
      'TAX_CALC'
    );
  }
  
  // Hard stop for extremely large refunds (more than £10,000)
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
  // Only clamp to 0 for positive allowances; K codes can have taxable > gross
  const rawTaxableYTD = Math.floor(validated.grossPayYTD - freePayYTD);
  const taxablePayYTD = taxCodeInfo.allowance >= 0 ? Math.max(0, rawTaxableYTD) : rawTaxableYTD;
  
  // Step 3: Get tax bands and calculate total tax due YTD
  const taxBands = await getIncomeTaxBands(taxYear);
  const taxDueYTD = calculateTaxByBands(taxablePayYTD, taxBands);
  
  // Step 4: Tax this period = Tax due YTD - Tax already paid YTD
  // This can be negative (refund) if previous periods overpaid
  const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
  
  // Check for anomalies - skip % check for cumulative (we don't have actual period pay)
  checkForAnomalies(taxThisPeriod, 0, 'Cumulative calculation', {
    taxCode: validated.taxCode,
    isActualPeriodGross: false
  });
  
  return {
    taxThisPeriod,
    taxDueYTD: roundToTwoDecimals(taxDueYTD),
    freePayYTD,
    taxablePayYTD
  };
}

/**
 * @deprecated Use calculateCumulativeTax (async) for production payroll.
 * This synchronous version uses hardcoded 2024/25 tax bands and does not
 * support tax year variation. Retained for backward compatibility and testing.
 * 
 * LIMITATIONS:
 * - Basic rate band: Hardcoded at £37,700
 * - Higher rate threshold: Hardcoded at £125,140
 * - Does not fetch current tax bands from database
 * - Tax year parameter not supported
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
    checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'BR cumulative', {
      taxCode: 'BR',
      isActualPeriodGross: false
    });
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
    checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'D0 cumulative', {
      taxCode: 'D0',
      isActualPeriodGross: false
    });
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
    checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'D1 cumulative', {
      taxCode: 'D1',
      isActualPeriodGross: false
    });
    return {
      taxThisPeriod,
      taxDueYTD: roundToTwoDecimals(taxDueYTD),
      freePayYTD: 0,
      taxablePayYTD
    };
  }
  
  // Standard cumulative calculation for other codes (1257L, K codes, 0T, etc.)
  const freePayYTD = roundToTwoDecimals(taxCodeInfo.monthlyFreePay * validated.period);
  
  // Only clamp to 0 for positive allowances; K codes can have taxable > gross
  const rawTaxableYTD = Math.floor(validated.grossPayYTD - freePayYTD);
  const taxablePayYTD = taxCodeInfo.allowance >= 0 ? Math.max(0, rawTaxableYTD) : rawTaxableYTD;
  
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
  
  // Check for anomalies - skip % check for cumulative (estimated gross)
  checkForAnomalies(taxThisPeriod, 0, 'Cumulative sync', {
    taxCode: validated.taxCode,
    isActualPeriodGross: false
  });
  
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
 * Tax bands are fetched from the database for the given tax year,
 * then scaled to monthly (1/12th, floored to nearest pound).
 * 
 * @param grossPayThisPeriod - Gross pay this period only (in pounds)
 * @param taxCode - Employee tax code (e.g., '45L', 'BR', 'D0', 'D1')
 * @param taxYear - Optional tax year for fetching correct tax bands
 * @returns Tax due this period (non-cumulative)
 * 
 * @throws ZodError if inputs fail validation
 * @throws UnrecognizedTaxCodeError if tax code is not valid
 * @throws UnsupportedTaxRegionError if Scottish/Welsh tax code used
 */
export async function calculateWeek1Month1Tax(
  grossPayThisPeriod: number,
  taxCode: string,
  taxYear?: string
): Promise<Week1Month1TaxResult> {
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
    checkForAnomalies(taxThisPeriod, validated.grossPayThisPeriod, 'BR W1/M1', {
      taxCode: 'BR',
      isActualPeriodGross: true
    });
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
    checkForAnomalies(taxThisPeriod, validated.grossPayThisPeriod, 'D0 W1/M1', {
      taxCode: 'D0',
      isActualPeriodGross: true
    });
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
    checkForAnomalies(taxThisPeriod, validated.grossPayThisPeriod, 'D1 W1/M1', {
      taxCode: 'D1',
      isActualPeriodGross: true
    });
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
  // Only clamp to 0 for positive allowances; K codes can have taxable > gross
  const rawTaxable = Math.floor(validated.grossPayThisPeriod - freePayMonthly);
  const taxablePayThisPeriod = taxCodeInfo.allowance >= 0 ? Math.max(0, rawTaxable) : rawTaxable;
  
  // Fetch tax bands from database for the given tax year
  const taxBands = await getIncomeTaxBands(taxYear);
  
  // Monthly tax band limits (1/12 of annual, floored to nearest pound)
  // Thresholds are stored in pennies in the DB, convert to pounds first
  const annualBasicTo = taxBands.HIGHER_RATE.threshold_from / 100;
  const annualHigherTo = taxBands.ADDITIONAL_RATE.threshold_from / 100;
  const monthlyBasicLimit = Math.floor(annualBasicTo / 12);
  const monthlyHigherLimit = Math.floor(annualHigherTo / 12);
  
  let taxThisPeriod = 0;
  
  // Basic rate - first portion of taxable pay
  if (taxablePayThisPeriod > 0) {
    const basicAmount = Math.min(taxablePayThisPeriod, monthlyBasicLimit);
    taxThisPeriod += basicAmount * taxBands.BASIC_RATE.rate;
  }
  
  // Higher rate
  if (taxablePayThisPeriod > monthlyBasicLimit) {
    const higherAmount = Math.min(taxablePayThisPeriod - monthlyBasicLimit, monthlyHigherLimit - monthlyBasicLimit);
    taxThisPeriod += higherAmount * taxBands.HIGHER_RATE.rate;
  }
  
  // Additional rate
  if (taxablePayThisPeriod > monthlyHigherLimit) {
    const additionalAmount = taxablePayThisPeriod - monthlyHigherLimit;
    taxThisPeriod += additionalAmount * taxBands.ADDITIONAL_RATE.rate;
  }
  
  const finalTax = roundToTwoDecimals(taxThisPeriod);
  
  // Check for anomalies - W1/M1 has actual period gross
  checkForAnomalies(finalTax, validated.grossPayThisPeriod, 'W1/M1 calculation', {
    taxCode: validated.taxCode,
    isActualPeriodGross: true
  });
  
  return {
    taxThisPeriod: finalTax,
    freePayMonthly,
    taxablePayThisPeriod
  };
}


import { parseTaxCode } from "../utils/tax-code-utils";
import { getIncomeTaxBands, calculateTaxByBands } from "../utils/tax-bands-utils";

/**
 * Round to two decimal places (local version to avoid null handling)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
 */
export async function calculateCumulativeTax(
  period: number,
  grossPayYTD: number,
  taxCode: string,
  taxPaidYTD: number,
  taxYear?: string
): Promise<CumulativeTaxResult> {
  // Parse tax code to get monthly free pay
  const taxCodeInfo = parseTaxCode(taxCode);
  
  // Handle special tax codes
  if (taxCode.toUpperCase() === 'NT') {
    // No Tax code - no tax due ever
    return {
      taxThisPeriod: -taxPaidYTD, // Refund any previously paid tax
      taxDueYTD: 0,
      freePayYTD: Infinity,
      taxablePayYTD: 0
    };
  }
  
  // Step 1: Calculate cumulative free pay YTD
  // For K codes, monthlyFreePay is negative (adds to taxable income)
  const freePayYTD = roundToTwoDecimals(taxCodeInfo.monthlyFreePay * period);
  
  // Step 2: Calculate taxable pay YTD (rounded down to nearest pound)
  // For K codes, freePayYTD is negative, so this adds to taxable income
  const taxablePayYTD = Math.max(0, Math.floor(grossPayYTD - freePayYTD));
  
  // Step 3: Get tax bands and calculate total tax due YTD
  const taxBands = await getIncomeTaxBands(taxYear);
  const taxDueYTD = calculateTaxByBands(taxablePayYTD, taxBands);
  
  // Step 4: Tax this period = Tax due YTD - Tax already paid YTD
  // This can be negative (refund) if previous periods overpaid
  const taxThisPeriod = roundToTwoDecimals(taxDueYTD - taxPaidYTD);
  
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
 */
export function calculateCumulativeTaxSync(
  period: number,
  grossPayYTD: number,
  taxCode: string,
  taxPaidYTD: number
): CumulativeTaxResult {
  const upperTaxCode = taxCode.toUpperCase().trim();
  const taxCodeInfo = parseTaxCode(taxCode);
  
  // Handle NT code - no tax ever
  if (upperTaxCode === 'NT') {
    return {
      taxThisPeriod: roundToTwoDecimals(-taxPaidYTD),
      taxDueYTD: 0,
      freePayYTD: Infinity,
      taxablePayYTD: 0
    };
  }
  
  // Handle BR code - basic rate (20%) on ALL income, no personal allowance
  if (upperTaxCode === 'BR') {
    const taxablePayYTD = Math.floor(grossPayYTD);
    const taxDueYTD = taxablePayYTD * 0.2;
    return {
      taxThisPeriod: roundToTwoDecimals(taxDueYTD - taxPaidYTD),
      taxDueYTD: roundToTwoDecimals(taxDueYTD),
      freePayYTD: 0,
      taxablePayYTD
    };
  }
  
  // Handle D0 code - higher rate (40%) on ALL income
  if (upperTaxCode === 'D0') {
    const taxablePayYTD = Math.floor(grossPayYTD);
    const taxDueYTD = taxablePayYTD * 0.4;
    return {
      taxThisPeriod: roundToTwoDecimals(taxDueYTD - taxPaidYTD),
      taxDueYTD: roundToTwoDecimals(taxDueYTD),
      freePayYTD: 0,
      taxablePayYTD
    };
  }
  
  // Handle D1 code - additional rate (45%) on ALL income
  if (upperTaxCode === 'D1') {
    const taxablePayYTD = Math.floor(grossPayYTD);
    const taxDueYTD = taxablePayYTD * 0.45;
    return {
      taxThisPeriod: roundToTwoDecimals(taxDueYTD - taxPaidYTD),
      taxDueYTD: roundToTwoDecimals(taxDueYTD),
      freePayYTD: 0,
      taxablePayYTD
    };
  }
  
  // Standard cumulative calculation for other codes (1257L, K codes, 0T, etc.)
  const freePayYTD = roundToTwoDecimals(taxCodeInfo.monthlyFreePay * period);
  const taxablePayYTD = Math.max(0, Math.floor(grossPayYTD - freePayYTD));
  
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
  
  const taxThisPeriod = roundToTwoDecimals(taxDueYTD - taxPaidYTD);
  
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
 */
export function calculateWeek1Month1Tax(
  grossPayThisPeriod: number,
  taxCode: string
): Week1Month1TaxResult {
  const upperTaxCode = taxCode.toUpperCase().trim();
  
  // Handle NT code - no tax
  if (upperTaxCode === 'NT') {
    return {
      taxThisPeriod: 0,
      freePayMonthly: Infinity,
      taxablePayThisPeriod: 0
    };
  }
  
  // Handle BR code - basic rate (20%) on ALL income
  if (upperTaxCode === 'BR') {
    const taxablePayThisPeriod = Math.floor(grossPayThisPeriod);
    return {
      taxThisPeriod: roundToTwoDecimals(taxablePayThisPeriod * 0.2),
      freePayMonthly: 0,
      taxablePayThisPeriod
    };
  }
  
  // Handle D0 code - higher rate (40%) on ALL income
  if (upperTaxCode === 'D0') {
    const taxablePayThisPeriod = Math.floor(grossPayThisPeriod);
    return {
      taxThisPeriod: roundToTwoDecimals(taxablePayThisPeriod * 0.4),
      freePayMonthly: 0,
      taxablePayThisPeriod
    };
  }
  
  // Handle D1 code - additional rate (45%) on ALL income
  if (upperTaxCode === 'D1') {
    const taxablePayThisPeriod = Math.floor(grossPayThisPeriod);
    return {
      taxThisPeriod: roundToTwoDecimals(taxablePayThisPeriod * 0.45),
      freePayMonthly: 0,
      taxablePayThisPeriod
    };
  }
  
  // Parse tax code for monthly free pay
  const taxCodeInfo = parseTaxCode(taxCode);
  const freePayMonthly = taxCodeInfo.monthlyFreePay;
  
  // Calculate taxable pay (rounded down to nearest pound)
  // For K codes, freePayMonthly is negative, so this adds to taxable income
  const taxablePayThisPeriod = Math.max(0, Math.floor(grossPayThisPeriod - freePayMonthly));
  
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
  
  return {
    taxThisPeriod: roundToTwoDecimals(taxThisPeriod),
    freePayMonthly,
    taxablePayThisPeriod
  };
}

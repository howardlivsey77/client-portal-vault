
import { roundToTwoDecimals } from "@/lib/formatters";
import { parseTaxCode } from "../utils/tax-code-utils";
import { getIncomeTaxBands, calculateTaxByBands } from "../utils/tax-bands-utils";

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
  // This is a simplified sync version - for full accuracy use the async version
  const taxCodeInfo = parseTaxCode(taxCode);
  
  if (taxCode.toUpperCase() === 'NT') {
    return {
      taxThisPeriod: -taxPaidYTD,
      taxDueYTD: 0,
      freePayYTD: Infinity,
      taxablePayYTD: 0
    };
  }
  
  const freePayYTD = roundToTwoDecimals(taxCodeInfo.monthlyFreePay * period);
  const taxablePayYTD = Math.max(0, Math.floor(grossPayYTD - freePayYTD));
  
  // Use simplified band calculation (20% basic rate)
  // For accurate results, use the async version
  let taxDueYTD = taxablePayYTD * 0.2;
  
  // Apply higher rate (40%) for income over £37,700
  if (taxablePayYTD > 37700) {
    taxDueYTD = 37700 * 0.2 + (taxablePayYTD - 37700) * 0.4;
  }
  
  // Apply additional rate (45%) for income over £125,140
  if (taxablePayYTD > 125140) {
    taxDueYTD = 37700 * 0.2 + (125140 - 37700) * 0.4 + (taxablePayYTD - 125140) * 0.45;
  }
  
  const taxThisPeriod = roundToTwoDecimals(taxDueYTD - taxPaidYTD);
  
  return {
    taxThisPeriod,
    taxDueYTD: roundToTwoDecimals(taxDueYTD),
    freePayYTD,
    taxablePayYTD
  };
}

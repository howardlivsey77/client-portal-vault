
import { FormattedTaxBands, getTaxBandsForCalculation } from "../data/taxBandsService";
import { TAX_BANDS } from "../constants/tax-constants";

/**
 * Cache for recently used tax bands
 */
let currentTaxBandsCache: FormattedTaxBands | null = null;

/**
 * Retrieve tax bands, using cache if available or fetching from database
 */
export async function getIncomeTaxBands(taxYear?: string): Promise<FormattedTaxBands> {
  // Use cached bands if available
  if (currentTaxBandsCache) {
    return currentTaxBandsCache;
  }
  
  try {
    // Fetch from database
    const taxBands = await getTaxBandsForCalculation('UK', taxYear);
    currentTaxBandsCache = taxBands;
    return taxBands;
  } catch (error) {
    console.error('Error fetching tax bands, using default bands:', error);
    // Fallback to constants if database fetch fails
    return TAX_BANDS as unknown as FormattedTaxBands;
  }
}

/**
 * Clear the tax bands cache to force a fresh fetch
 */
export function clearTaxBandsCache(): void {
  currentTaxBandsCache = null;
}

/**
 * Calculate tax based on taxable income and tax bands
 */
export function calculateTaxByBands(taxableIncome: number, taxBands: FormattedTaxBands): number {
  let remainingIncome = taxableIncome;
  let totalTax = 0;
  
  // Calculate tax for additional rate band (highest)
  if (remainingIncome > taxBands.HIGHER_RATE.threshold) {
    const additionalRateIncome = remainingIncome - taxBands.HIGHER_RATE.threshold;
    totalTax += additionalRateIncome * taxBands.ADDITIONAL_RATE.rate;
    remainingIncome = taxBands.HIGHER_RATE.threshold;
  }
  
  // Calculate tax for higher rate band
  if (remainingIncome > taxBands.BASIC_RATE.threshold) {
    const higherRateIncome = remainingIncome - taxBands.BASIC_RATE.threshold;
    totalTax += higherRateIncome * taxBands.HIGHER_RATE.rate;
    remainingIncome = taxBands.BASIC_RATE.threshold;
  }
  
  // Calculate tax for basic rate band
  if (remainingIncome > 0) {
    totalTax += remainingIncome * taxBands.BASIC_RATE.rate;
  }
  
  return totalTax;
}

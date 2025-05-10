
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
    
    console.log('Fetched tax bands from database:', taxBands);
    
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
  console.log('Calculating tax for income:', taxableIncome, 'with bands:', taxBands);
  
  let remainingIncome = taxableIncome;
  let totalTax = 0;
  
  // Check if we're using the threshold value directly from DB (in pennies) or need to convert
  const higherRateThreshold = taxBands.HIGHER_RATE.threshold / 100; // Convert from pennies to pounds if stored in pennies
  
  // Calculate tax for additional rate band (highest)
  if (remainingIncome > higherRateThreshold) {
    const additionalRateIncome = remainingIncome - higherRateThreshold;
    const additionalRateTax = additionalRateIncome * taxBands.ADDITIONAL_RATE.rate;
    
    console.log(`Additional rate tax: ${additionalRateIncome} × ${taxBands.ADDITIONAL_RATE.rate} = ${additionalRateTax}`);
    
    totalTax += additionalRateTax;
    remainingIncome = higherRateThreshold;
  }
  
  // Calculate tax for higher rate band
  const basicRateThreshold = taxBands.BASIC_RATE.threshold / 100; // Convert from pennies to pounds if stored in pennies
  
  if (remainingIncome > basicRateThreshold) {
    const higherRateIncome = remainingIncome - basicRateThreshold;
    const higherRateTax = higherRateIncome * taxBands.HIGHER_RATE.rate;
    
    console.log(`Higher rate tax: ${higherRateIncome} × ${taxBands.HIGHER_RATE.rate} = ${higherRateTax}`);
    
    totalTax += higherRateTax;
    remainingIncome = basicRateThreshold;
  }
  
  // Calculate tax for basic rate band
  if (remainingIncome > 0) {
    const basicRateTax = remainingIncome * taxBands.BASIC_RATE.rate;
    
    console.log(`Basic rate tax: ${remainingIncome} × ${taxBands.BASIC_RATE.rate} = ${basicRateTax}`);
    
    totalTax += basicRateTax;
  }
  
  console.log('Total calculated tax:', totalTax);
  
  return totalTax;
}

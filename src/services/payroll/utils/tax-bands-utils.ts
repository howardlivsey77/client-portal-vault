
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
 * Round down to nearest pound
 * This is important for tax calculations as HMRC rounds down taxable income
 */
function roundDownToNearestPound(amount: number): number {
  return Math.floor(amount);
}

/**
 * Calculate tax based on taxable income and tax bands using the new range-based approach
 */
export function calculateTaxByBands(taxableIncome: number, taxBands: FormattedTaxBands): number {
  console.log('Calculating tax for income:', taxableIncome, 'with bands:', taxBands);
  
  // Round down taxable income to the nearest pound as per HMRC rules
  const roundedTaxableIncome = roundDownToNearestPound(taxableIncome);
  console.log('Rounded down taxable income:', roundedTaxableIncome);
  
  let totalTax = 0;
  
  // Convert income to pennies for comparison with thresholds
  const incomeInPennies = Math.round(roundedTaxableIncome * 100);
  console.log('Income in pennies:', incomeInPennies);
  
  // Calculate tax for each band based on the income within that band's range
  
  // Basic Rate - applies from threshold_from up to threshold_to
  const basicRateFrom = taxBands.BASIC_RATE.threshold_from / 100; // Convert to pounds
  const basicRateTo = taxBands.BASIC_RATE.threshold_to ? taxBands.BASIC_RATE.threshold_to / 100 : Infinity; // Convert to pounds
  
  if (roundedTaxableIncome > basicRateFrom) {
    // Calculate income that falls within the basic rate band
    const incomeInBasicBand = Math.min(roundedTaxableIncome, basicRateTo) - basicRateFrom;
    const basicRateTax = incomeInBasicBand * taxBands.BASIC_RATE.rate;
    
    console.log(`Basic rate tax: ${incomeInBasicBand} × ${taxBands.BASIC_RATE.rate} = ${basicRateTax}`);
    console.log(`Basic rate band: ${basicRateFrom} to ${basicRateTo}`);
    
    totalTax += basicRateTax;
  }
  
  // Higher Rate - applies from threshold_from up to threshold_to
  const higherRateFrom = taxBands.HIGHER_RATE.threshold_from / 100; // Convert to pounds
  const higherRateTo = taxBands.HIGHER_RATE.threshold_to ? taxBands.HIGHER_RATE.threshold_to / 100 : Infinity; // Convert to pounds
  
  if (roundedTaxableIncome > higherRateFrom) {
    // Calculate income that falls within the higher rate band
    const incomeInHigherBand = Math.min(roundedTaxableIncome, higherRateTo) - higherRateFrom;
    const higherRateTax = incomeInHigherBand * taxBands.HIGHER_RATE.rate;
    
    console.log(`Higher rate tax: ${incomeInHigherBand} × ${taxBands.HIGHER_RATE.rate} = ${higherRateTax}`);
    console.log(`Higher rate band: ${higherRateFrom} to ${higherRateTo}`);
    
    totalTax += higherRateTax;
  }
  
  // Additional Rate - applies from threshold_from and above
  const additionalRateFrom = taxBands.ADDITIONAL_RATE.threshold_from / 100; // Convert to pounds
  
  if (roundedTaxableIncome > additionalRateFrom) {
    // Calculate income that falls within the additional rate band
    const incomeInAdditionalBand = roundedTaxableIncome - additionalRateFrom;
    const additionalRateTax = incomeInAdditionalBand * taxBands.ADDITIONAL_RATE.rate;
    
    console.log(`Additional rate tax: ${incomeInAdditionalBand} × ${taxBands.ADDITIONAL_RATE.rate} = ${additionalRateTax}`);
    console.log(`Additional rate band: ${additionalRateFrom} and above`);
    
    totalTax += additionalRateTax;
  }
  
  console.log('Total calculated tax:', totalTax);
  
  return totalTax;
}

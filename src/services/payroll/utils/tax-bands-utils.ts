
import { FormattedTaxBands, getTaxBandsForCalculation } from "../data/taxBandsService";
import { TAX_BANDS } from "../constants/tax-constants";
import { payrollLogger } from "./payrollLogger";

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
    
    payrollLogger.debug('Fetched tax bands from database', { employeeId: 'system' }, 'TAX_CALC');
    
    currentTaxBandsCache = taxBands;
    return taxBands;
  } catch (error) {
    payrollLogger.error('Error fetching tax bands, using default bands', error, 'TAX_CALC');
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
 * Calculate tax based on taxable income and tax bands using the new range-based approach.
 * 
 * @param taxableIncome - The taxable income to calculate tax on (in pounds)
 * @param taxBands - The tax bands configuration to use
 * @returns Tax amount at FULL PRECISION (not rounded).
 *          Caller is responsible for rounding to 2dp at output boundary.
 */
export function calculateTaxByBands(taxableIncome: number, taxBands: FormattedTaxBands): number {
  // Round down taxable income to the nearest pound as per HMRC rules
  const roundedTaxableIncome = roundDownToNearestPound(taxableIncome);
  
  payrollLogger.calculation('Tax calculation started', { 
    taxableIncome, 
    roundedTaxableIncome 
  }, 'TAX_CALC');
  
  let totalTax = 0;
  
  // Calculate tax for each band based on the income within that band's range
  
  // Basic Rate - applies from threshold_from up to threshold_to
  const basicRateFrom = taxBands.BASIC_RATE.threshold_from / 100; // Convert to pounds
  const basicRateTo = taxBands.BASIC_RATE.threshold_to ? taxBands.BASIC_RATE.threshold_to / 100 : Infinity;
  
  if (roundedTaxableIncome > basicRateFrom) {
    // Calculate income that falls within the basic rate band
    const incomeInBasicBand = Math.min(roundedTaxableIncome, basicRateTo) - basicRateFrom;
    const basicRateTax = incomeInBasicBand * taxBands.BASIC_RATE.rate;
    
    payrollLogger.calculation('Basic rate tax', {
      incomeInBasicBand,
      rate: taxBands.BASIC_RATE.rate,
      basicRateTax
    }, 'TAX_CALC');
    
    totalTax += basicRateTax;
  }
  
  // Higher Rate - applies from threshold_from up to threshold_to
  const higherRateFrom = taxBands.HIGHER_RATE.threshold_from / 100;
  const higherRateTo = taxBands.HIGHER_RATE.threshold_to ? taxBands.HIGHER_RATE.threshold_to / 100 : Infinity;
  
  if (roundedTaxableIncome > higherRateFrom) {
    // Calculate income that falls within the higher rate band
    const incomeInHigherBand = Math.min(roundedTaxableIncome, higherRateTo) - higherRateFrom;
    const higherRateTax = incomeInHigherBand * taxBands.HIGHER_RATE.rate;
    
    payrollLogger.calculation('Higher rate tax', {
      incomeInHigherBand,
      rate: taxBands.HIGHER_RATE.rate,
      higherRateTax
    }, 'TAX_CALC');
    
    totalTax += higherRateTax;
  }
  
  // Additional Rate - applies from threshold_from and above
  const additionalRateFrom = taxBands.ADDITIONAL_RATE.threshold_from / 100;
  
  if (roundedTaxableIncome > additionalRateFrom) {
    // Calculate income that falls within the additional rate band
    const incomeInAdditionalBand = roundedTaxableIncome - additionalRateFrom;
    const additionalRateTax = incomeInAdditionalBand * taxBands.ADDITIONAL_RATE.rate;
    
    payrollLogger.calculation('Additional rate tax', {
      incomeInAdditionalBand,
      rate: taxBands.ADDITIONAL_RATE.rate,
      additionalRateTax
    }, 'TAX_CALC');
    
    totalTax += additionalRateTax;
  }
  
  payrollLogger.calculation('Total tax calculated', { totalTax }, 'TAX_CALC');
  
  return totalTax;
}


import { TAX_BANDS } from "../constants/tax-constants";
import { parseTaxCode } from "../utils/tax-code-utils";
import { roundToTwoDecimals } from "@/lib/formatters";
import { getTaxBandsForCalculation, FormattedTaxBands } from "../data/taxBandsService";

// A local cache to avoid multiple fetches in the same calculation flow
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
 * Calculate income tax based on annual salary and tax code
 */
export async function calculateIncomeTaxAsync(annualSalary: number, taxCode: string, taxYear?: string): Promise<number> {
  const { allowance } = parseTaxCode(taxCode);
  let taxableIncome = Math.max(0, annualSalary - allowance);
  let tax = 0;
  
  // Get tax bands (dynamic from database, fallback to constants)
  const taxBands = await getIncomeTaxBands(taxYear);
  
  // Calculate tax for each band
  if (taxableIncome > taxBands.HIGHER_RATE.threshold) {
    tax += (taxableIncome - taxBands.HIGHER_RATE.threshold) * taxBands.ADDITIONAL_RATE.rate;
    taxableIncome = taxBands.HIGHER_RATE.threshold;
  }
  
  if (taxableIncome > taxBands.BASIC_RATE.threshold) {
    tax += (taxableIncome - taxBands.BASIC_RATE.threshold) * taxBands.HIGHER_RATE.rate;
    taxableIncome = taxBands.BASIC_RATE.threshold;
  }
  
  if (taxableIncome > 0) {
    tax += taxableIncome * taxBands.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate income tax based on annual salary and tax code
 * This synchronous version is kept for backward compatibility
 */
export function calculateIncomeTax(annualSalary: number, taxCode: string): number {
  const { allowance } = parseTaxCode(taxCode);
  let taxableIncome = Math.max(0, annualSalary - allowance);
  let tax = 0;
  
  // Use hardcoded TAX_BANDS for backward compatibility
  // This ensures existing code continues to work without needing to handle promises
  
  // Calculate tax for each band
  if (taxableIncome > TAX_BANDS.HIGHER_RATE.threshold) {
    tax += (taxableIncome - TAX_BANDS.HIGHER_RATE.threshold) * TAX_BANDS.ADDITIONAL_RATE.rate;
    taxableIncome = TAX_BANDS.HIGHER_RATE.threshold;
  }
  
  if (taxableIncome > TAX_BANDS.BASIC_RATE.threshold) {
    tax += (taxableIncome - TAX_BANDS.BASIC_RATE.threshold) * TAX_BANDS.HIGHER_RATE.rate;
    taxableIncome = TAX_BANDS.BASIC_RATE.threshold;
  }
  
  if (taxableIncome > TAX_BANDS.PERSONAL_ALLOWANCE.threshold) {
    tax += (taxableIncome - TAX_BANDS.PERSONAL_ALLOWANCE.threshold) * TAX_BANDS.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate monthly income tax using the specific tax-free allowance (free pay)
 * calculation based on tax code
 */
export async function calculateMonthlyIncomeTaxAsync(monthlySalary: number, taxCode: string, taxYear?: string): Promise<{
  monthlyTax: number;
  freePay: number;
}> {
  const taxCodeInfo = parseTaxCode(taxCode);
  const monthlyFreePay = taxCodeInfo.monthlyFreePay;
  
  // Calculate taxable monthly income
  const taxableMonthlySalary = Math.max(0, monthlySalary - monthlyFreePay);
  
  // Calculate annual equivalents
  const annualSalary = monthlySalary * 12;
  
  // Calculate annual tax using the async method
  const annualTax = await calculateIncomeTaxAsync(annualSalary, taxCode, taxYear);
  
  // Return monthly tax and free pay
  return {
    monthlyTax: roundToTwoDecimals(annualTax / 12),
    freePay: roundToTwoDecimals(monthlyFreePay)
  };
}

/**
 * Calculate monthly income tax using the specific tax-free allowance (free pay)
 * calculation based on tax code
 * This synchronous version is kept for backward compatibility
 */
export function calculateMonthlyIncomeTax(monthlySalary: number, taxCode: string): {
  monthlyTax: number;
  freePay: number;
} {
  const taxCodeInfo = parseTaxCode(taxCode);
  const monthlyFreePay = taxCodeInfo.monthlyFreePay;
  
  // Calculate taxable monthly income
  const taxableMonthlySalary = Math.max(0, monthlySalary - monthlyFreePay);
  
  // Calculate annual equivalents
  const annualSalary = monthlySalary * 12;
  
  // Calculate annual tax using synchronous method
  const annualTax = calculateIncomeTax(annualSalary, taxCode);
  
  // Return monthly tax and free pay
  return {
    monthlyTax: roundToTwoDecimals(annualTax / 12),
    freePay: roundToTwoDecimals(monthlyFreePay)
  };
}

/**
 * Calculate income tax based on YTD taxable pay
 * This function calculates total tax due based on YTD taxable pay
 */
export async function calculateIncomeTaxFromYTDAsync(taxablePayYTD: number, taxCode: string, taxYear?: string): Promise<number> {
  const { allowance } = parseTaxCode(taxCode);
  let taxableIncome = taxablePayYTD;
  let tax = 0;
  
  // Get tax bands (dynamic from database, fallback to constants)
  const taxBands = await getIncomeTaxBands(taxYear);
  
  // Calculate tax for each band based on the YTD taxable pay
  if (taxableIncome > taxBands.HIGHER_RATE.threshold) {
    tax += (taxableIncome - taxBands.HIGHER_RATE.threshold) * taxBands.ADDITIONAL_RATE.rate;
    taxableIncome = taxBands.HIGHER_RATE.threshold;
  }
  
  if (taxableIncome > taxBands.BASIC_RATE.threshold) {
    tax += (taxableIncome - taxBands.BASIC_RATE.threshold) * taxBands.HIGHER_RATE.rate;
    taxableIncome = taxBands.BASIC_RATE.threshold;
  }
  
  if (taxableIncome > 0) {
    tax += taxableIncome * taxBands.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate income tax based on YTD taxable pay
 * This function calculates total tax due based on YTD taxable pay
 * This synchronous version is kept for backward compatibility
 */
export function calculateIncomeTaxFromYTD(taxablePayYTD: number, taxCode: string): number {
  const { allowance } = parseTaxCode(taxCode);
  let taxableIncome = taxablePayYTD;
  let tax = 0;
  
  // Calculate tax for each band based on the YTD taxable pay using hardcoded bands
  if (taxableIncome > TAX_BANDS.HIGHER_RATE.threshold) {
    tax += (taxableIncome - TAX_BANDS.HIGHER_RATE.threshold) * TAX_BANDS.ADDITIONAL_RATE.rate;
    taxableIncome = TAX_BANDS.HIGHER_RATE.threshold;
  }
  
  if (taxableIncome > TAX_BANDS.BASIC_RATE.threshold) {
    tax += (taxableIncome - TAX_BANDS.BASIC_RATE.threshold) * TAX_BANDS.HIGHER_RATE.rate;
    taxableIncome = TAX_BANDS.BASIC_RATE.threshold;
  }
  
  if (taxableIncome > TAX_BANDS.PERSONAL_ALLOWANCE.threshold) {
    tax += (taxableIncome - TAX_BANDS.PERSONAL_ALLOWANCE.threshold) * TAX_BANDS.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

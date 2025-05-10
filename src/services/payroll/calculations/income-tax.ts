
import { roundToTwoDecimals } from "@/lib/formatters";
import { parseTaxCode } from "../utils/tax-code-utils";
import { TAX_BANDS } from "../constants/tax-constants";
import { 
  getIncomeTaxBands, 
  clearTaxBandsCache, 
  calculateTaxByBands 
} from "../utils/tax-bands-utils";

/**
 * Re-export clearTaxBandsCache for external use
 */
export { clearTaxBandsCache, getIncomeTaxBands };

/**
 * Calculate annual income tax based on salary and tax code (async version)
 */
export async function calculateIncomeTaxAsync(annualSalary: number, taxCode: string, taxYear?: string): Promise<number> {
  const { allowance } = parseTaxCode(taxCode);
  const taxableIncome = Math.max(0, annualSalary - allowance);
  
  // Get tax bands (dynamic from database, fallback to constants)
  const taxBands = await getIncomeTaxBands(taxYear);
  
  // Calculate tax using our utility function
  const tax = calculateTaxByBands(taxableIncome, taxBands);
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate income tax based on annual salary and tax code
 * This synchronous version is kept for backward compatibility
 */
export function calculateIncomeTax(annualSalary: number, taxCode: string): number {
  const { allowance } = parseTaxCode(taxCode);
  const taxableIncome = Math.max(0, annualSalary - allowance);
  
  // Use hardcoded TAX_BANDS for backward compatibility
  // Calculate tax by bands
  let tax = 0;
  let remainingIncome = taxableIncome;
  
  if (remainingIncome > TAX_BANDS.HIGHER_RATE.threshold) {
    tax += (remainingIncome - TAX_BANDS.HIGHER_RATE.threshold) * TAX_BANDS.ADDITIONAL_RATE.rate;
    remainingIncome = TAX_BANDS.HIGHER_RATE.threshold;
  }
  
  if (remainingIncome > TAX_BANDS.BASIC_RATE.threshold) {
    tax += (remainingIncome - TAX_BANDS.BASIC_RATE.threshold) * TAX_BANDS.HIGHER_RATE.rate;
    remainingIncome = TAX_BANDS.BASIC_RATE.threshold;
  }
  
  if (remainingIncome > TAX_BANDS.PERSONAL_ALLOWANCE.threshold) {
    tax += (remainingIncome - TAX_BANDS.PERSONAL_ALLOWANCE.threshold) * TAX_BANDS.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate monthly tax and free pay based on monthly salary and tax code (async version)
 */
export async function calculateMonthlyIncomeTaxAsync(monthlySalary: number, taxCode: string, taxYear?: string): Promise<{
  monthlyTax: number;
  freePay: number;
}> {
  // Get tax code info and monthly free pay
  const taxCodeInfo = parseTaxCode(taxCode);
  const monthlyFreePay = taxCodeInfo.monthlyFreePay;
  
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
 * Calculate monthly tax and free pay based on monthly salary and tax code
 * Synchronous version for backward compatibility
 */
export function calculateMonthlyIncomeTax(monthlySalary: number, taxCode: string): {
  monthlyTax: number;
  freePay: number;
} {
  const taxCodeInfo = parseTaxCode(taxCode);
  const monthlyFreePay = taxCodeInfo.monthlyFreePay;
  
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
 * Calculate income tax based on YTD taxable pay (async version)
 */
export async function calculateIncomeTaxFromYTDAsync(taxablePayYTD: number, taxCode: string, taxYear?: string): Promise<number> {
  // Get tax bands (dynamic from database, fallback to constants)
  const taxBands = await getIncomeTaxBands(taxYear);
  
  // Calculate tax using our utility function
  const tax = calculateTaxByBands(taxablePayYTD, taxBands);
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate income tax based on YTD taxable pay
 * Synchronous version for backward compatibility
 */
export function calculateIncomeTaxFromYTD(taxablePayYTD: number, taxCode: string): number {
  // Use hardcoded TAX_BANDS for backward compatibility
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

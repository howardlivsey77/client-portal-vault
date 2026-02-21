
import { roundToTwoDecimals } from "@/lib/formatters";
import { parseTaxCode } from "../utils/tax-code-utils";
import { 
  getIncomeTaxBands, 
  clearTaxBandsCache, 
  calculateTaxByBands 
} from "../utils/tax-bands-utils";

/**
 * Re-export cumulative tax calculation for external use
 */
export { 
  calculateCumulativeTax, 
  calculateCumulativeTaxSync,
  type CumulativeTaxResult 
} from './cumulative-tax';

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
 * @deprecated BROKEN — fires an async call but returns 0 synchronously.
 * Use `calculateIncomeTaxAsync` instead. This function will be removed in a future release.
 * @throws {Error} Always throws to prevent silent incorrect results.
 */
export function calculateIncomeTax(_annualSalary: number, _taxCode: string): never {
  throw new Error(
    '[calculateIncomeTax] BROKEN: This synchronous wrapper returns 0 and silently discards the real result. ' +
    'Use calculateIncomeTaxAsync instead.'
  );
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
 * @deprecated BROKEN — delegates to calculateIncomeTax which is broken.
 * Use `calculateMonthlyIncomeTaxAsync` instead. This function will be removed in a future release.
 * @throws {Error} Always throws to prevent silent incorrect results.
 */
export function calculateMonthlyIncomeTax(_monthlySalary: number, _taxCode: string): never {
  throw new Error(
    '[calculateMonthlyIncomeTax] BROKEN: Delegates to the broken synchronous calculateIncomeTax. ' +
    'Use calculateMonthlyIncomeTaxAsync instead.'
  );
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
 * @deprecated BROKEN — fires an async call but returns 0 synchronously.
 * Use `calculateIncomeTaxFromYTDAsync` instead. This function will be removed in a future release.
 * @throws {Error} Always throws to prevent silent incorrect results.
 */
export function calculateIncomeTaxFromYTD(_taxablePayYTD: number, _taxCode: string): never {
  throw new Error(
    '[calculateIncomeTaxFromYTD] BROKEN: This synchronous wrapper returns 0 and silently discards the real result. ' +
    'Use calculateIncomeTaxFromYTDAsync instead.'
  );
}

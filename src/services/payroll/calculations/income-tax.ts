
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
 * but will use the database-backed async version under the hood
 */
export function calculateIncomeTax(annualSalary: number, taxCode: string): number {
  // Immediately invoke an async function and wait for it
  // This is a temporary solution to maintain backward compatibility
  // while we transition to the async version
  let tax = 0;
  
  // Use the async version to get the result from the database
  calculateIncomeTaxAsync(annualSalary, taxCode)
    .then((result) => {
      tax = result;
    })
    .catch((error) => {
      console.error("Error in calculateIncomeTax:", error);
      
      // Fallback to hardcoded calculation if database lookup fails
      const { allowance } = parseTaxCode(taxCode);
      const taxableIncome = Math.max(0, annualSalary - allowance);
      
      // Updated fallback calculation using the new tax bands structure
      let fallbackTax = 0;
      
      // Basic Rate tax (0 to 37,700)
      const basicRateAmount = Math.min(taxableIncome, TAX_BANDS.HIGHER_RATE.threshold_from/100);
      if (basicRateAmount > 0) {
        fallbackTax += basicRateAmount * TAX_BANDS.BASIC_RATE.rate;
      }
      
      // Higher Rate tax (37,700 to 125,140)
      if (taxableIncome > TAX_BANDS.HIGHER_RATE.threshold_from/100) {
        const higherRateAmount = Math.min(
          taxableIncome - TAX_BANDS.HIGHER_RATE.threshold_from/100,
          (TAX_BANDS.ADDITIONAL_RATE.threshold_from - TAX_BANDS.HIGHER_RATE.threshold_from)/100
        );
        fallbackTax += higherRateAmount * TAX_BANDS.HIGHER_RATE.rate;
      }
      
      // Additional Rate tax (over 125,140)
      if (taxableIncome > TAX_BANDS.ADDITIONAL_RATE.threshold_from/100) {
        const additionalRateAmount = taxableIncome - TAX_BANDS.ADDITIONAL_RATE.threshold_from/100;
        fallbackTax += additionalRateAmount * TAX_BANDS.ADDITIONAL_RATE.rate;
      }
      
      tax = roundToTwoDecimals(fallbackTax);
    });
  
  return tax;
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
  let tax = 0;
  
  // Use the async version to get the result from the database
  calculateIncomeTaxFromYTDAsync(taxablePayYTD, taxCode)
    .then((result) => {
      tax = result;
    })
    .catch((error) => {
      console.error("Error in calculateIncomeTaxFromYTD:", error);
      
      // Fallback to hardcoded calculation using new structure
      let fallbackTax = 0;
      
      // Basic Rate tax (0 to 37,700)
      const basicRateAmount = Math.min(taxablePayYTD, TAX_BANDS.HIGHER_RATE.threshold_from/100);
      if (basicRateAmount > 0) {
        fallbackTax += basicRateAmount * TAX_BANDS.BASIC_RATE.rate;
      }
      
      // Higher Rate tax (37,700 to 125,140)
      if (taxablePayYTD > TAX_BANDS.HIGHER_RATE.threshold_from/100) {
        const higherRateAmount = Math.min(
          taxablePayYTD - TAX_BANDS.HIGHER_RATE.threshold_from/100,
          (TAX_BANDS.ADDITIONAL_RATE.threshold_from - TAX_BANDS.HIGHER_RATE.threshold_from)/100
        );
        fallbackTax += higherRateAmount * TAX_BANDS.HIGHER_RATE.rate;
      }
      
      // Additional Rate tax (over 125,140)
      if (taxablePayYTD > TAX_BANDS.ADDITIONAL_RATE.threshold_from/100) {
        const additionalRateAmount = taxablePayYTD - TAX_BANDS.ADDITIONAL_RATE.threshold_from/100;
        fallbackTax += additionalRateAmount * TAX_BANDS.ADDITIONAL_RATE.rate;
      }
      
      tax = roundToTwoDecimals(fallbackTax);
    });
  
  return tax;
}

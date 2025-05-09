
import { roundToTwoDecimals } from "@/lib/formatters";
import { getHardcodedTaxBands, getTaxConstantsByCategory } from "../utils/tax-constants-service";
import { parseTaxCode } from "../utils/tax-code-utils";

interface TaxBand {
  threshold: number;
  rate: number;
}

/**
 * Get tax bands from database or fallback to hardcoded values
 */
async function getTaxBands(): Promise<Record<string, TaxBand>> {
  try {
    const constants = await getTaxConstantsByCategory('TAX_BANDS');
    
    // Tax band names
    const taxBandNames = ['PERSONAL_ALLOWANCE', 'BASIC_RATE', 'HIGHER_RATE', 'ADDITIONAL_RATE'];
    const taxBands: Record<string, TaxBand> = {};
    
    // Process each tax band
    taxBandNames.forEach(bandName => {
      const thresholdConstant = constants.find(c => c.key === `${bandName}_THRESHOLD`);
      const rateConstant = constants.find(c => c.key === `${bandName}_RATE`);
      
      if (thresholdConstant?.value_numeric !== null || rateConstant?.value_numeric !== null) {
        taxBands[bandName] = {
          threshold: thresholdConstant?.value_numeric ?? (bandName === 'ADDITIONAL_RATE' ? Infinity : 0),
          rate: rateConstant?.value_numeric ?? 0
        };
      }
    });
    
    // If we didn't get all the bands, use the hardcoded ones
    if (Object.keys(taxBands).length < taxBandNames.length - 1) { // Additional rate might not have threshold
      return getHardcodedTaxBands();
    }
    
    // Make sure ADDITIONAL_RATE has Infinity threshold if not specified
    if (taxBands['ADDITIONAL_RATE'] && taxBands['ADDITIONAL_RATE'].threshold === 0) {
      taxBands['ADDITIONAL_RATE'].threshold = Infinity;
    }
    
    return taxBands;
  } catch (error) {
    console.error("Error fetching tax bands:", error);
    return getHardcodedTaxBands();
  }
}

/**
 * Calculate income tax based on annual salary and tax code asynchronously
 */
export async function calculateIncomeTax(annualSalary: number, taxCode: string): Promise<number> {
  const { allowance } = parseTaxCode(taxCode);
  const taxBands = await getTaxBands();
  
  let taxableIncome = Math.max(0, annualSalary - allowance);
  let tax = 0;
  
  // Calculate tax for each band
  if (taxableIncome > taxBands.HIGHER_RATE.threshold) {
    tax += (taxableIncome - taxBands.HIGHER_RATE.threshold) * taxBands.ADDITIONAL_RATE.rate;
    taxableIncome = taxBands.HIGHER_RATE.threshold;
  }
  
  if (taxableIncome > taxBands.BASIC_RATE.threshold) {
    tax += (taxableIncome - taxBands.BASIC_RATE.threshold) * taxBands.HIGHER_RATE.rate;
    taxableIncome = taxBands.BASIC_RATE.threshold;
  }
  
  if (taxableIncome > taxBands.PERSONAL_ALLOWANCE.threshold) {
    tax += (taxableIncome - taxBands.PERSONAL_ALLOWANCE.threshold) * taxBands.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate monthly income tax asynchronously
 */
export async function calculateMonthlyIncomeTax(monthlySalary: number, taxCode: string): Promise<number> {
  const annualSalary = monthlySalary * 12;
  const annualTax = await calculateIncomeTax(annualSalary, taxCode);
  return roundToTwoDecimals(annualTax / 12);
}

/**
 * Synchronous version using hardcoded values for compatibility
 */
export function calculateIncomeTaxSync(annualSalary: number, taxCode: string): number {
  const { allowance } = parseTaxCode(taxCode);
  const taxBands = getHardcodedTaxBands();
  
  let taxableIncome = Math.max(0, annualSalary - allowance);
  let tax = 0;
  
  // Calculate tax for each band
  if (taxableIncome > taxBands.HIGHER_RATE.threshold) {
    tax += (taxableIncome - taxBands.HIGHER_RATE.threshold) * taxBands.ADDITIONAL_RATE.rate;
    taxableIncome = taxBands.HIGHER_RATE.threshold;
  }
  
  if (taxableIncome > taxBands.BASIC_RATE.threshold) {
    tax += (taxableIncome - taxBands.BASIC_RATE.threshold) * taxBands.HIGHER_RATE.rate;
    taxableIncome = taxBands.BASIC_RATE.threshold;
  }
  
  if (taxableIncome > taxBands.PERSONAL_ALLOWANCE.threshold) {
    tax += (taxableIncome - taxBands.PERSONAL_ALLOWANCE.threshold) * taxBands.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Synchronous version for monthly income tax
 */
export function calculateMonthlyIncomeTaxSync(monthlySalary: number, taxCode: string): number {
  const annualSalary = monthlySalary * 12;
  const annualTax = calculateIncomeTaxSync(annualSalary, taxCode);
  return roundToTwoDecimals(annualTax / 12);
}

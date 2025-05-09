
import { roundToTwoDecimals } from "@/lib/formatters";
import { parseTaxCode } from "../utils/tax-code-utils";
import { getHardcodedTaxBands } from "../utils/tax-constants-service";
import { TaxBandCollection } from "./income-tax-types";

/**
 * Calculate income tax based on annual salary, tax code, and region
 * Synchronous version for immediate calculations
 */
export function calculateIncomeTaxSync(
  annualSalary: number, 
  taxCode: string, 
  region: string = 'UK'
): number {
  const { allowance } = parseTaxCode(taxCode);
  const taxBands = getHardcodedTaxBands(region);
  
  let taxableIncome = Math.max(0, annualSalary - allowance);
  let tax = 0;
  
  if (region === 'Scotland') {
    // Scottish tax calculation
    if (taxableIncome > taxBands.HIGHER_RATE.threshold) {
      tax += (taxableIncome - taxBands.HIGHER_RATE.threshold) * taxBands.ADDITIONAL_RATE.rate;
      taxableIncome = taxBands.HIGHER_RATE.threshold;
    }
    
    if (taxableIncome > taxBands.INTERMEDIATE_RATE.threshold) {
      tax += (taxableIncome - taxBands.INTERMEDIATE_RATE.threshold) * taxBands.HIGHER_RATE.rate;
      taxableIncome = taxBands.INTERMEDIATE_RATE.threshold;
    }
    
    if (taxableIncome > taxBands.BASIC_RATE.threshold) {
      tax += (taxableIncome - taxBands.BASIC_RATE.threshold) * taxBands.INTERMEDIATE_RATE.rate;
      taxableIncome = taxBands.BASIC_RATE.threshold;
    }
    
    if (taxableIncome > taxBands.STARTER_RATE.threshold) {
      tax += (taxableIncome - taxBands.STARTER_RATE.threshold) * taxBands.BASIC_RATE.rate;
      taxableIncome = taxBands.STARTER_RATE.threshold;
    }
    
    if (taxableIncome > taxBands.PERSONAL_ALLOWANCE.threshold) {
      tax += (taxableIncome - taxBands.PERSONAL_ALLOWANCE.threshold) * taxBands.STARTER_RATE.rate;
    }
  } else {
    // UK/Wales tax calculation
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
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate monthly income tax based on monthly salary
 * Synchronous version for immediate calculations
 */
export function calculateMonthlyIncomeTaxSync(
  monthlySalary: number, 
  taxCode: string, 
  region: string = 'UK'
): number {
  const annualSalary = monthlySalary * 12;
  const annualTax = calculateIncomeTaxSync(annualSalary, taxCode, region);
  return roundToTwoDecimals(annualTax / 12);
}

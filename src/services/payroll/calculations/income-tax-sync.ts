
import { roundToTwoDecimals } from "@/lib/formatters";
import { parseTaxCode, calculateMonthlyFreePay } from "../utils/tax-code-utils";
import { getHardcodedTaxBands } from "../utils/tax-constants-service";
import { TaxBandCollection } from "./income-tax-types";
import { calculateUKTax } from "./uk-tax-calculator";
import { calculateScottishTax } from "./scottish-tax-calculator";
import { calculateEmergencyTax } from "./emergency-tax-calculator";
import { calculateMonthlyUKTax } from "./uk-tax-calculator";
import { calculateMonthlyScottishTax } from "./scottish-tax-calculator";

/**
 * Calculate income tax based on annual salary, tax code, and region
 * Synchronous version for immediate calculations
 */
export function calculateIncomeTaxSync(
  annualSalary: number, 
  taxCode: string, 
  region: string = 'UK'
): number {
  // Get tax-free allowance from tax code
  const { allowance } = parseTaxCode(taxCode);
  
  // Get tax bands for this region
  const taxBands = getHardcodedTaxBands(region);
  
  // Calculate taxable income after personal allowance
  const taxableIncome = Math.max(0, annualSalary - allowance);
  
  // Use the appropriate tax calculation based on region
  if (region === 'Scotland') {
    return calculateScottishTax(taxableIncome, taxBands);
  } else {
    // UK or Wales
    return calculateUKTax(taxableIncome, taxBands);
  }
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
  // Check if this is an emergency tax code (Week1/Month1)
  const isEmergencyTax = taxCode.includes('M1');
  
  // Get tax bands for this region
  const taxBands = getHardcodedTaxBands(region);
  
  // For emergency tax calculation (Week1/Month1)
  if (isEmergencyTax) {
    const { monthlyAllowance } = parseTaxCode(taxCode.replace(' M1', ''));
    return calculateEmergencyTax(monthlySalary, monthlyAllowance, region, taxBands);
  }
  
  // For normal calculation (non-emergency)
  // Get monthly allowance from tax code
  const { monthlyAllowance } = parseTaxCode(taxCode);
  const taxableMonthlyIncome = Math.max(0, monthlySalary - monthlyAllowance);
  
  // Use the appropriate monthly tax calculator based on region
  if (region === 'Scotland') {
    return calculateMonthlyScottishTax(taxableMonthlyIncome, taxBands);
  } else {
    // UK or Wales
    return calculateMonthlyUKTax(taxableMonthlyIncome, taxBands);
  }
}

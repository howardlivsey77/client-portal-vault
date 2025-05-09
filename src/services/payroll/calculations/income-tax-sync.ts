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
  // Check if this is an emergency tax code (Week1/Month1)
  const isEmergencyTax = taxCode.includes('M1');
  
  // For emergency tax calculation, process just this month's salary
  if (isEmergencyTax) {
    const { monthlyAllowance } = parseTaxCode(taxCode.replace(' M1', ''));
    const taxableMonthlyIncome = Math.max(0, monthlySalary - monthlyAllowance);
    
    // Calculate tax using tax bands for just this month
    // Divide annual thresholds by 12 for monthly calculation
    const taxBands = getHardcodedTaxBands(region);
    let tax = 0;
    let remainingIncome = taxableMonthlyIncome;
    
    if (region === 'Scotland') {
      // Scottish tax calculation logic
      if (remainingIncome > taxBands.HIGHER_RATE.threshold) {
        tax += (remainingIncome - taxBands.HIGHER_RATE.threshold) * taxBands.ADDITIONAL_RATE.rate;
        remainingIncome = taxBands.HIGHER_RATE.threshold;
      }
      
      if (remainingIncome > taxBands.INTERMEDIATE_RATE.threshold) {
        tax += (remainingIncome - taxBands.INTERMEDIATE_RATE.threshold) * taxBands.HIGHER_RATE.rate;
        remainingIncome = taxBands.INTERMEDIATE_RATE.threshold;
      }
      
      if (remainingIncome > taxBands.BASIC_RATE.threshold) {
        tax += (remainingIncome - taxBands.BASIC_RATE.threshold) * taxBands.INTERMEDIATE_RATE.rate;
        remainingIncome = taxBands.BASIC_RATE.threshold;
      }
      
      if (remainingIncome > taxBands.STARTER_RATE.threshold) {
        tax += (remainingIncome - taxBands.STARTER_RATE.threshold) * taxBands.BASIC_RATE.rate;
        remainingIncome = taxBands.STARTER_RATE.threshold;
      }
      
      if (remainingIncome > taxBands.PERSONAL_ALLOWANCE.threshold) {
        tax += (remainingIncome - taxBands.PERSONAL_ALLOWANCE.threshold) * taxBands.STARTER_RATE.rate;
      }
    } else {
      // UK/Wales tax calculation for monthly income
      const monthlyHigherThreshold = taxBands.HIGHER_RATE.threshold / 12;
      const monthlyBasicThreshold = taxBands.BASIC_RATE.threshold / 12;
      
      if (remainingIncome > monthlyHigherThreshold) {
        tax += (remainingIncome - monthlyHigherThreshold) * taxBands.ADDITIONAL_RATE.rate;
        remainingIncome = monthlyHigherThreshold;
      }
      
      if (remainingIncome > monthlyBasicThreshold) {
        tax += (remainingIncome - monthlyBasicThreshold) * taxBands.HIGHER_RATE.rate;
        remainingIncome = monthlyBasicThreshold;
      }
      
      if (remainingIncome > 0) {
        tax += remainingIncome * taxBands.BASIC_RATE.rate;
      }
    }
    
    return roundToTwoDecimals(tax);
  }
  
  // For normal calculation, calculate annual equivalent and then divide
  const annualSalary = monthlySalary * 12;
  const annualTax = calculateIncomeTaxSync(annualSalary, taxCode, region);
  return roundToTwoDecimals(annualTax / 12);
}

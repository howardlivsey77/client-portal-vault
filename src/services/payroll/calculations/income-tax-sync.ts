
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
 * FIXED: Improved monthly tax calculation logic
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
    
    // Get tax bands for this region
    const taxBands = getHardcodedTaxBands(region);
    let tax = 0;
    
    if (region === 'Scotland') {
      // Scottish tax calculation - monthly thresholds
      const monthlyThresholds = {
        starter: taxBands.STARTER_RATE.threshold / 12,
        basic: taxBands.BASIC_RATE.threshold / 12,
        intermediate: taxBands.INTERMEDIATE_RATE.threshold / 12,
        higher: taxBands.HIGHER_RATE.threshold / 12,
        additional: Infinity
      };
      
      let remainingIncome = taxableMonthlyIncome;
      
      if (remainingIncome > monthlyThresholds.higher) {
        tax += (remainingIncome - monthlyThresholds.higher) * taxBands.ADDITIONAL_RATE.rate;
        remainingIncome = monthlyThresholds.higher;
      }
      
      if (remainingIncome > monthlyThresholds.intermediate) {
        tax += (remainingIncome - monthlyThresholds.intermediate) * taxBands.HIGHER_RATE.rate;
        remainingIncome = monthlyThresholds.intermediate;
      }
      
      if (remainingIncome > monthlyThresholds.basic) {
        tax += (remainingIncome - monthlyThresholds.basic) * taxBands.INTERMEDIATE_RATE.rate;
        remainingIncome = monthlyThresholds.basic;
      }
      
      if (remainingIncome > monthlyThresholds.starter) {
        tax += (remainingIncome - monthlyThresholds.starter) * taxBands.BASIC_RATE.rate;
        remainingIncome = monthlyThresholds.starter;
      }
      
      if (remainingIncome > 0) {
        tax += remainingIncome * taxBands.STARTER_RATE.rate;
      }
    } else {
      // UK/Wales tax calculation - monthly thresholds
      const monthlyBasicThreshold = taxBands.BASIC_RATE.threshold / 12;
      const monthlyHigherThreshold = taxBands.HIGHER_RATE.threshold / 12;
      
      let remainingIncome = taxableMonthlyIncome;
      
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
  
  // IMPROVED: For normal calculation (non-emergency)
  // We'll calculate this directly rather than going through the annual calculation
  const { monthlyAllowance } = parseTaxCode(taxCode);
  const taxableMonthlyIncome = Math.max(0, monthlySalary - monthlyAllowance);
  
  // Get tax bands for this region
  const taxBands = getHardcodedTaxBands(region);
  let tax = 0;
  
  if (region === 'Scotland') {
    // Scottish tax calculation with monthly thresholds
    const monthlyThresholds = {
      starter: taxBands.STARTER_RATE.threshold / 12,
      basic: taxBands.BASIC_RATE.threshold / 12,
      intermediate: taxBands.INTERMEDIATE_RATE.threshold / 12,
      higher: taxBands.HIGHER_RATE.threshold / 12,
      additional: Infinity
    };
    
    let remainingIncome = taxableMonthlyIncome;
    
    if (remainingIncome > monthlyThresholds.higher) {
      tax += (remainingIncome - monthlyThresholds.higher) * taxBands.ADDITIONAL_RATE.rate;
      remainingIncome = monthlyThresholds.higher;
    }
    
    if (remainingIncome > monthlyThresholds.intermediate) {
      tax += (remainingIncome - monthlyThresholds.intermediate) * taxBands.HIGHER_RATE.rate;
      remainingIncome = monthlyThresholds.intermediate;
    }
    
    if (remainingIncome > monthlyThresholds.basic) {
      tax += (remainingIncome - monthlyThresholds.basic) * taxBands.INTERMEDIATE_RATE.rate;
      remainingIncome = monthlyThresholds.basic;
    }
    
    if (remainingIncome > monthlyThresholds.starter) {
      tax += (remainingIncome - monthlyThresholds.starter) * taxBands.BASIC_RATE.rate;
      remainingIncome = monthlyThresholds.starter;
    }
    
    if (remainingIncome > 0) {
      tax += remainingIncome * taxBands.STARTER_RATE.rate;
    }
  } else {
    // UK/Wales tax calculation with monthly thresholds
    const monthlyBasicThreshold = taxBands.BASIC_RATE.threshold / 12;
    const monthlyHigherThreshold = taxBands.HIGHER_RATE.threshold / 12;
    
    let remainingIncome = taxableMonthlyIncome;
    
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

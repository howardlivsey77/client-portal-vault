
import { roundToTwoDecimals } from "@/lib/formatters";
import { getHardcodedNIRates, getHardcodedNIThresholds, getTaxConstantsByCategory } from "../utils/tax-constants-service";
import { NICCalculator, NICRates, NICThresholds, NICResult } from "./NICCalculator";

// Default NIC letter if not specified
const DEFAULT_NIC_LETTER = 'A';

/**
 * Get NI thresholds and rates from database or fallback to hardcoded values
 */
async function getNIData(): Promise<{ 
  thresholds: NICThresholds;
  rates: NICRates;
}> {
  try {
    // Fetch data from database
    const thresholdsData = await getTaxConstantsByCategory('NI_THRESHOLDS');
    const employeeRatesData = await getTaxConstantsByCategory('NI_EMPLOYEE_RATES');
    const employerRatesData = await getTaxConstantsByCategory('NI_EMPLOYER_RATES');
    
    // Extract threshold values in pence
    const primaryThresholdMonthly = thresholdsData.find(t => t.key === 'PRIMARY_THRESHOLD')?.value_numeric ?? 0;
    const secondaryThresholdMonthly = thresholdsData.find(t => t.key === 'SECONDARY_THRESHOLD')?.value_numeric ?? 0; 
    const upperEarningsLimitMonthly = thresholdsData.find(t => t.key === 'UPPER_EARNINGS_LIMIT')?.value_numeric ?? 0;
    
    // Convert monthly values to pence
    const PT = Math.round(primaryThresholdMonthly * 100);
    const ST = Math.round(secondaryThresholdMonthly * 100);
    const UEL = Math.round(upperEarningsLimitMonthly * 100);
    
    // Create the rates structure for employee NI contributions
    const employeeRates: Record<string, NICRateBand> = {};
    const employerRates: Record<string, NICRateBand> = {};
    
    // Get all NIC categories we support
    const nicCategories = ['A', 'B', 'C', 'H', 'J', 'M'];
    
    // Build rate structures for each NIC category from database values
    for (const category of nicCategories) {
      // Get employee rates for this category
      const lelToPtRate = employeeRatesData.find(r => r.key === `${category}_LEL_TO_PT`)?.value_numeric ?? 0;
      const ptToUelRate = employeeRatesData.find(r => r.key === `${category}_PT_TO_UEL`)?.value_numeric ?? 0;
      const aboveUelRate = employeeRatesData.find(r => r.key === `${category}_ABOVE_UEL`)?.value_numeric ?? 0;
      
      employeeRates[category] = {
        LELToPT: lelToPtRate,
        PTToUEL: ptToUelRate,
        AboveUEL: aboveUelRate
      };
      
      // Get employer rates for this category
      const lelToStRate = employerRatesData.find(r => r.key === `${category}_LEL_TO_ST`)?.value_numeric ?? 0;
      const stToUelRate = employerRatesData.find(r => r.key === `${category}_ST_TO_UEL`)?.value_numeric ?? 0;
      const erAboveUelRate = employerRatesData.find(r => r.key === `${category}_ABOVE_UEL`)?.value_numeric ?? 0;
      
      employerRates[category] = {
        LELToPT: lelToStRate,
        PTToUEL: stToUelRate,
        AboveUEL: erAboveUelRate
      };
    }
    
    const rates: NICRates = {
      employee: employeeRates,
      employer: employerRates
    };
    
    return {
      thresholds: { PT, ST, UEL },
      rates
    };
  } catch (error) {
    console.error("Error fetching NI data:", error);
    // Fallback to hardcoded values
    return getHardcodedNICalculatorData();
  }
}

/**
 * Get hardcoded NI calculator data
 */
function getHardcodedNICalculatorData(): { thresholds: NICThresholds; rates: NICRates } {
  const hardcodedThresholds = getHardcodedNIThresholds();
  const hardcodedRates = getHardcodedNIRates();
  
  // Convert monthly values to pence
  const PT = Math.round(hardcodedThresholds.PRIMARY_THRESHOLD.monthly * 100);
  const ST = PT; // Usually the same as PT for most categories
  const UEL = Math.round(hardcodedThresholds.UPPER_EARNINGS_LIMIT.monthly * 100);
  
  // Create NICRates with multiple categories
  const rates: NICRates = {
    employee: {
      'A': { LELToPT: 0, PTToUEL: hardcodedRates.MAIN_RATE, AboveUEL: hardcodedRates.HIGHER_RATE },
      'B': { LELToPT: 0, PTToUEL: 0.0585, AboveUEL: 0.0585 }, // Married women's reduced rate
      'C': { LELToPT: 0, PTToUEL: 0, AboveUEL: 0 },           // Not liable for EE contributions
      'H': { LELToPT: 0, PTToUEL: hardcodedRates.MAIN_RATE, AboveUEL: hardcodedRates.HIGHER_RATE }, // Apprentice
      'J': { LELToPT: 0, PTToUEL: hardcodedRates.MAIN_RATE, AboveUEL: hardcodedRates.HIGHER_RATE }, // Deferred
      'M': { LELToPT: 0, PTToUEL: 0.0585, AboveUEL: 0.0585 }, // Married women's reduced rate, deferred
    },
    employer: {
      'A': { LELToPT: 0, PTToUEL: 0.138, AboveUEL: 0.138 },    // Standard rate 13.8%
      'B': { LELToPT: 0, PTToUEL: 0.138, AboveUEL: 0.138 },    // Standard rate 13.8%
      'C': { LELToPT: 0, PTToUEL: 0.138, AboveUEL: 0.138 },    // Standard rate 13.8%
      'H': { LELToPT: 0, PTToUEL: 0.00, AboveUEL: 0.00 },      // No employer NI for apprentices under 25
      'J': { LELToPT: 0, PTToUEL: 0.138, AboveUEL: 0.138 },    // Standard rate 13.8%
      'M': { LELToPT: 0, PTToUEL: 0.138, AboveUEL: 0.138 },    // Standard rate 13.8%
    }
  };
  
  return {
    thresholds: { PT, ST, UEL },
    rates
  };
}

/**
 * Calculate National Insurance contributions asynchronously
 * @param monthlySalary Salary in pounds (will be converted to pence)
 * @param nicCode NI code letter (defaults to 'A' if not specified)
 */
export async function calculateNationalInsurance(
  monthlySalary: number,
  nicCode: string = DEFAULT_NIC_LETTER
): Promise<number> {
  const { thresholds, rates } = await getNIData();
  
  // Convert pounds to pence
  const grossPayPence = Math.round(monthlySalary * 100);
  
  // Create calculator instance
  const calculator = new NICCalculator(thresholds, rates);
  
  try {
    // Calculate NI contributions
    const result = calculator.calculate(grossPayPence, nicCode);
    
    // Return employee NI in pounds (convert from pence)
    return roundToTwoDecimals(result.employeeNIC / 100);
  } catch (error) {
    console.error(`Error calculating National Insurance for code ${nicCode}:`, error);
    
    // Fallback to standard category 'A' if specific category fails
    if (nicCode !== DEFAULT_NIC_LETTER) {
      console.warn(`Falling back to category '${DEFAULT_NIC_LETTER}' for NI calculation`);
      return calculateNationalInsurance(monthlySalary, DEFAULT_NIC_LETTER);
    }
    
    // Last resort fallback to old calculation method
    return calculateNationalInsuranceSync(monthlySalary);
  }
}

/**
 * Synchronous version using hardcoded values for compatibility
 * This is kept for backward compatibility
 */
export function calculateNationalInsuranceSync(monthlySalary: number): number {
  const hardcodedThresholds = getHardcodedNIThresholds();
  const hardcodedRates = getHardcodedNIRates();
  
  const primaryThreshold = hardcodedThresholds.PRIMARY_THRESHOLD.monthly;
  const upperLimit = hardcodedThresholds.UPPER_EARNINGS_LIMIT.monthly;
  
  let ni = 0;
  
  // Main rate between primary threshold and upper earnings limit
  if (monthlySalary > primaryThreshold) {
    const mainRatePortion = Math.min(monthlySalary, upperLimit) - primaryThreshold;
    ni += mainRatePortion * hardcodedRates.MAIN_RATE;
    
    // Higher rate above upper earnings limit
    if (monthlySalary > upperLimit) {
      ni += (monthlySalary - upperLimit) * hardcodedRates.HIGHER_RATE;
    }
  }
  
  return roundToTwoDecimals(ni);
}

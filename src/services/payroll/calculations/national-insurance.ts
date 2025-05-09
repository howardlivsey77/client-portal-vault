
import { roundToTwoDecimals } from "@/lib/formatters";
import { getHardcodedNIRates, getHardcodedNIThresholds, getTaxConstantsByCategory } from "../utils/tax-constants-service";

/**
 * Get NI thresholds and rates from database or fallback to hardcoded values
 */
async function getNIData(): Promise<{ 
  thresholds: { primaryThreshold: number; upperEarningsLimit: number };
  rates: { mainRate: number; higherRate: number };
}> {
  try {
    const thresholdsData = await getTaxConstantsByCategory('NI_THRESHOLDS');
    const ratesData = await getTaxConstantsByCategory('NI_RATES');
    
    // Extract threshold values
    const primaryThreshold = thresholdsData.find(t => t.key === 'PRIMARY_THRESHOLD')?.value_numeric ?? 0;
    const upperEarningsLimit = thresholdsData.find(t => t.key === 'UPPER_EARNINGS_LIMIT')?.value_numeric ?? 0;
    
    // Extract rate values
    const mainRate = ratesData.find(r => r.key === 'MAIN_RATE')?.value_numeric ?? 0;
    const higherRate = ratesData.find(r => r.key === 'HIGHER_RATE')?.value_numeric ?? 0;
    
    return {
      thresholds: { primaryThreshold, upperEarningsLimit },
      rates: { mainRate, higherRate }
    };
  } catch (error) {
    console.error("Error fetching NI data:", error);
    // Fallback to hardcoded values
    const hardcodedThresholds = getHardcodedNIThresholds();
    const hardcodedRates = getHardcodedNIRates();
    
    return {
      thresholds: {
        primaryThreshold: hardcodedThresholds.PRIMARY_THRESHOLD.monthly,
        upperEarningsLimit: hardcodedThresholds.UPPER_EARNINGS_LIMIT.monthly
      },
      rates: {
        mainRate: hardcodedRates.MAIN_RATE,
        higherRate: hardcodedRates.HIGHER_RATE
      }
    };
  }
}

/**
 * Calculate National Insurance contributions asynchronously
 */
export async function calculateNationalInsurance(monthlySalary: number): Promise<number> {
  const { thresholds, rates } = await getNIData();
  
  let ni = 0;
  
  // Main rate between primary threshold and upper earnings limit
  if (monthlySalary > thresholds.primaryThreshold) {
    const mainRatePortion = Math.min(monthlySalary, thresholds.upperEarningsLimit) - thresholds.primaryThreshold;
    ni += mainRatePortion * rates.mainRate;
    
    // Higher rate above upper earnings limit
    if (monthlySalary > thresholds.upperEarningsLimit) {
      ni += (monthlySalary - thresholds.upperEarningsLimit) * rates.higherRate;
    }
  }
  
  return roundToTwoDecimals(ni);
}

/**
 * Synchronous version using hardcoded values for compatibility
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

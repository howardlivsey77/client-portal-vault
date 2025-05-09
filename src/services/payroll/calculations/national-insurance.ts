
import { NI_THRESHOLDS, NI_RATES } from "../constants/tax-constants";
import { roundToTwoDecimals } from "@/lib/formatters";

/**
 * Calculate National Insurance contributions
 */
export function calculateNationalInsurance(monthlySalary: number): number {
  const primaryThreshold = NI_THRESHOLDS.PRIMARY_THRESHOLD.monthly;
  const upperLimit = NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.monthly;
  
  let ni = 0;
  
  // Main rate between primary threshold and upper earnings limit
  if (monthlySalary > primaryThreshold) {
    const mainRatePortion = Math.min(monthlySalary, upperLimit) - primaryThreshold;
    ni += mainRatePortion * NI_RATES.MAIN_RATE;
    
    // Higher rate above upper earnings limit
    if (monthlySalary > upperLimit) {
      ni += (monthlySalary - upperLimit) * NI_RATES.HIGHER_RATE;
    }
  }
  
  return roundToTwoDecimals(ni);
}

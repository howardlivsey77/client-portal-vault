import { roundToTwoDecimals } from "@/lib/formatters";
import { NICalculationResult } from "./types";
import { NI_THRESHOLDS, NI_RATES } from "../../constants/tax-constants";
import { calculateNICEarningsBands } from "./earnings-bands";

/**
 * Fallback calculation using constants when database values are not available
 */
export function calculateNationalInsuranceFallback(monthlySalary: number): NICalculationResult {
  console.log(`[NI DEBUG] Using fallback NI calculation for salary: £${monthlySalary}`);
  
  // Define the thresholds using the UPDATED constants for 2025/26
  const primaryThreshold = NI_THRESHOLDS.PRIMARY_THRESHOLD.monthly; // £1048
  const lowerEarningsLimit = NI_THRESHOLDS.LOWER_EARNINGS_LIMIT.monthly; // £542 (updated)
  const upperLimit = NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.monthly; // £4189
  const secondaryThreshold = NI_THRESHOLDS.SECONDARY_THRESHOLD.monthly; // £758
  
  console.log(`[NI DEBUG] Fallback thresholds - LEL: £${lowerEarningsLimit}, PT: £${primaryThreshold}, UEL: £${upperLimit}, ST: ${secondaryThreshold}`);
  
  // VALIDATION: Ensure we have correct 2025/26 values
  if (lowerEarningsLimit !== 542) {
    console.warn(`[NI DEBUG] FALLBACK WARNING: LEL should be £542 for 2025/26, but constants show £${lowerEarningsLimit}`);
  }
  
  // Initialize result with NIC calculation
  const result: NICalculationResult = {
    nationalInsurance: 0,
    earningsAtLEL: 0,
    earningsLELtoPT: 0,
    earningsPTtoUEL: 0,
    earningsAboveUEL: 0,
    earningsAboveST: 0
  };
  
  // Calculate correct NIC earnings bands using the new logic
  const earningsBands = calculateNICEarningsBands(
    monthlySalary, 
    lowerEarningsLimit, 
    primaryThreshold, 
    upperLimit, 
    secondaryThreshold
  );
  
  // Apply the calculated bands to the result
  result.earningsAtLEL = earningsBands.earningsAtLEL;
  result.earningsLELtoPT = earningsBands.earningsLELtoPT;
  result.earningsPTtoUEL = earningsBands.earningsPTtoUEL;
  result.earningsAboveUEL = earningsBands.earningsAboveUEL;
  result.earningsAboveST = earningsBands.earningsAboveST;
  
  console.log(`[NI DEBUG] Earnings bands from UPDATED fallback calculation:
    - LEL: £${result.earningsAtLEL}
    - LEL to PT: £${result.earningsLELtoPT}
    - PT to UEL: £${result.earningsPTtoUEL}
    - Above UEL: £${result.earningsAboveUEL}
    - Above ST: ${result.earningsAboveST}
  `);
  
  // Additional validation for Klaudia's case in fallback
  if (monthlySalary > 2000 && monthlySalary < 2100) {
    console.log(`[NI DEBUG] KLAUDIA FALLBACK TEST with salary £${monthlySalary}`);
    console.log(`[NI DEBUG] LEL should be £542, got £${result.earningsAtLEL}`);
    console.log(`[NI DEBUG] LEL to PT should be £506, got £${result.earningsLELtoPT}`);
  }
  
  // Calculate NI - Main rate (12%) between PT and UEL (unchanged logic)
  if (result.earningsPTtoUEL > 0) {
    const mainRateContribution = result.earningsPTtoUEL * NI_RATES.MAIN_RATE;
    console.log(`[NI DEBUG] Main rate contribution: £${mainRateContribution} (£${result.earningsPTtoUEL} × ${NI_RATES.MAIN_RATE})`);
    result.nationalInsurance += mainRateContribution;
  }
  
  // Higher rate (2%) above UEL (unchanged logic)
  if (result.earningsAboveUEL > 0) {
    const higherRateContribution = result.earningsAboveUEL * NI_RATES.HIGHER_RATE;
    console.log(`[NI DEBUG] Higher rate contribution: £${higherRateContribution} (£${result.earningsAboveUEL} × ${NI_RATES.HIGHER_RATE})`);
    result.nationalInsurance += higherRateContribution;
  }
  
  result.nationalInsurance = roundToTwoDecimals(result.nationalInsurance);
  console.log(`[NI DEBUG] Total fallback NI: £${result.nationalInsurance}`);
  
  return result;
}

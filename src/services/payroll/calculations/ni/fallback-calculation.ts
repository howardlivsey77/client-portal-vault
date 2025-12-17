import { roundToTwoDecimals } from "@/lib/formatters";
import { NICalculationResult } from "./types";
import { NI_THRESHOLDS, NI_RATES } from "../../constants/tax-constants";
import { calculateNICEarningsBands } from "./earnings-bands";

/**
 * Fallback calculation using constants when database values are not available
 * 
 * Uses 2025/26 and 2026/27 NI rates:
 * - Employee: 8% between PT and UEL, 2% above UEL
 * - Employer: 15% above ST
 */
export function calculateNationalInsuranceFallback(monthlySalary: number): NICalculationResult {
  console.log(`[NI DEBUG] Using fallback NI calculation for salary: £${monthlySalary}`);
  
  // Define the thresholds using the UPDATED constants for 2025/26
  const primaryThreshold = NI_THRESHOLDS.PRIMARY_THRESHOLD.monthly; // £1048
  const lowerEarningsLimit = NI_THRESHOLDS.LOWER_EARNINGS_LIMIT.monthly; // £542
  const upperLimit = NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.monthly; // £4189
  const secondaryThreshold = NI_THRESHOLDS.SECONDARY_THRESHOLD.monthly; // £417
  
  console.log(`[NI DEBUG] Fallback thresholds - LEL: £${lowerEarningsLimit}, PT: £${primaryThreshold}, UEL: £${upperLimit}, ST: £${secondaryThreshold}`);
  
  // Initialize result with NIC calculation
  const result: NICalculationResult = {
    nationalInsurance: 0,
    employerNationalInsurance: 0,
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
  
  console.log(`[NI DEBUG] Earnings bands from fallback calculation:
    - LEL: £${result.earningsAtLEL}
    - LEL to PT: £${result.earningsLELtoPT}
    - PT to UEL: £${result.earningsPTtoUEL}
    - Above UEL: £${result.earningsAboveUEL}
    - Above ST: £${result.earningsAboveST}
  `);
  
  // Calculate Employee NI - Main rate (8%) between PT and UEL
  if (result.earningsPTtoUEL > 0) {
    const mainRateContribution = result.earningsPTtoUEL * NI_RATES.EMPLOYEE_MAIN_RATE;
    console.log(`[NI DEBUG] Employee main rate contribution: £${mainRateContribution} (£${result.earningsPTtoUEL} × ${NI_RATES.EMPLOYEE_MAIN_RATE})`);
    result.nationalInsurance += mainRateContribution;
  }
  
  // Employee higher rate (2%) above UEL
  if (result.earningsAboveUEL > 0) {
    const higherRateContribution = result.earningsAboveUEL * NI_RATES.EMPLOYEE_HIGHER_RATE;
    console.log(`[NI DEBUG] Employee higher rate contribution: £${higherRateContribution} (£${result.earningsAboveUEL} × ${NI_RATES.EMPLOYEE_HIGHER_RATE})`);
    result.nationalInsurance += higherRateContribution;
  }
  
  // Calculate Employer NI - 15% above ST
  if (result.earningsAboveST > 0) {
    result.employerNationalInsurance = roundToTwoDecimals(
      result.earningsAboveST * NI_RATES.EMPLOYER_RATE
    );
    console.log(`[NI DEBUG] Employer NI contribution: £${result.employerNationalInsurance} (£${result.earningsAboveST} × ${NI_RATES.EMPLOYER_RATE})`);
  }
  
  result.nationalInsurance = roundToTwoDecimals(result.nationalInsurance);
  console.log(`[NI DEBUG] Total Employee NI: £${result.nationalInsurance}, Employer NI: £${result.employerNationalInsurance}`);
  
  return result;
}

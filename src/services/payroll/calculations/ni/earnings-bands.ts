
import { roundToTwoDecimals } from "@/lib/formatters";
import { NICalculationResult } from "./types";

/**
 * Calculate NIC earnings bands according to HMRC reporting rules
 * This ensures proper reporting of earnings bands while maintaining correct NIC calculations
 */
export function calculateNICEarningsBands(
  monthlySalary: number,
  lel: number,
  pt: number,
  uel: number,
  st: number
): Pick<NICalculationResult, 'earningsAtLEL' | 'earningsLELtoPT' | 'earningsPTtoUEL' | 'earningsAboveUEL' | 'earningsAboveST'> {
  console.log(`[NIC BANDS] Calculating NIC earnings bands for salary: £${monthlySalary}`);
  console.log(`[NIC BANDS] Thresholds - LEL: £${lel}, PT: £${pt}, UEL: £${uel}, ST: £${st}`);
  
  let earningsAtLEL = 0;
  let earningsLELtoPT = 0;
  let earningsPTtoUEL = 0;
  let earningsAboveUEL = 0;
  let earningsAboveST = 0;
  
  if (monthlySalary <= lel) {
    // If salary doesn't exceed LEL, all earnings are at LEL level
    earningsAtLEL = monthlySalary;
    earningsLELtoPT = 0;
    earningsPTtoUEL = 0;
    earningsAboveUEL = 0;
    console.log(`[NIC BANDS] Salary below LEL - All earnings (£${monthlySalary}) reported at LEL`);
  } else if (monthlySalary <= pt) {
    // If salary exceeds LEL but not PT
    earningsAtLEL = lel; // Full LEL amount
    earningsLELtoPT = monthlySalary - lel;
    earningsPTtoUEL = 0;
    earningsAboveUEL = 0;
    console.log(`[NIC BANDS] Salary above LEL but below PT - LEL: £${earningsAtLEL}, LEL to PT: £${earningsLELtoPT}`);
  } else if (monthlySalary <= uel) {
    // If salary exceeds PT but not UEL
    earningsAtLEL = lel; // Full LEL amount
    earningsLELtoPT = pt - lel; // Full LEL to PT amount
    earningsPTtoUEL = monthlySalary - pt;
    earningsAboveUEL = 0;
    console.log(`[NIC BANDS] Salary above PT but below UEL - LEL: £${earningsAtLEL}, LEL to PT: £${earningsLELtoPT}, PT to UEL: £${earningsPTtoUEL}`);
  } else {
    // If salary exceeds UEL
    earningsAtLEL = lel; // Full LEL amount
    earningsLELtoPT = pt - lel; // Full LEL to PT amount
    earningsPTtoUEL = uel - pt; // Full PT to UEL amount
    earningsAboveUEL = monthlySalary - uel;
    console.log(`[NIC BANDS] Salary above UEL - LEL: £${earningsAtLEL}, LEL to PT: £${earningsLELtoPT}, PT to UEL: £${earningsPTtoUEL}, Above UEL: £${earningsAboveUEL}`);
  }
  
  // Calculate earnings above ST (Secondary Threshold) for employer NIC
  earningsAboveST = Math.max(0, monthlySalary - st);
  
  // Validation - ensure all earnings bands add up to the total salary
  const totalEarnings = earningsAtLEL + earningsLELtoPT + earningsPTtoUEL + earningsAboveUEL;
  if (Math.abs(totalEarnings - monthlySalary) > 0.01) {
    console.warn(`[NIC BANDS] WARNING: Earnings bands don't sum to total salary. Total: £${totalEarnings}, Salary: £${monthlySalary}`);
    console.warn(`[NIC BANDS] Bands: LEL: £${earningsAtLEL}, LEL to PT: £${earningsLELtoPT}, PT to UEL: £${earningsPTtoUEL}, Above UEL: £${earningsAboveUEL}`);
  }
  
  return {
    earningsAtLEL: roundToTwoDecimals(earningsAtLEL),
    earningsLELtoPT: roundToTwoDecimals(earningsLELtoPT),
    earningsPTtoUEL: roundToTwoDecimals(earningsPTtoUEL),
    earningsAboveUEL: roundToTwoDecimals(earningsAboveUEL),
    earningsAboveST: roundToTwoDecimals(earningsAboveST)
  };
}


import { roundToTwoDecimals } from "@/lib/formatters";
import { NICalculationResult } from "./types";
import { payrollLogger } from "@/services/payroll/utils/payrollLogger";

/**
 * Calculate NIC earnings bands for standard payroll categories (A, B, C, M, H, Z, J, V).
 *
 * NOTE: This implementation treats the full PT-to-UEL range as a single band.
 * For Freeports (F, I) and Investment Zone (D, E, K, N, S, L) categories,
 * the FUST/IZUST threshold splits this band — those categories are out of scope.
 *
 * For 2025/26, UST = AUST = VUST = UEL = £4,189/month, so no separate
 * upper secondary threshold band is needed for M, H, V, Z categories.
 */
export function calculateNICEarningsBands(
  monthlySalary: number,
  lel: number,
  pt: number,
  uel: number,
  st: number
): Pick<NICalculationResult, 'earningsAtLEL' | 'earningsLELtoPT' | 'earningsPTtoUEL' | 'earningsAboveUEL' | 'earningsAboveST'> {
  let earningsAtLEL = 0;
  let earningsLELtoPT = 0;
  let earningsPTtoUEL = 0;
  let earningsAboveUEL = 0;
  let earningsAboveST = 0;
  
  if (monthlySalary <= lel) {
    earningsAtLEL = monthlySalary;
    earningsLELtoPT = 0;
    earningsPTtoUEL = 0;
    earningsAboveUEL = 0;
  } else if (monthlySalary <= pt) {
    earningsAtLEL = lel;
    earningsLELtoPT = monthlySalary - lel;
    earningsPTtoUEL = 0;
    earningsAboveUEL = 0;
  } else if (monthlySalary <= uel) {
    earningsAtLEL = lel;
    earningsLELtoPT = pt - lel;
    earningsPTtoUEL = monthlySalary - pt;
    earningsAboveUEL = 0;
  } else {
    earningsAtLEL = lel;
    earningsLELtoPT = pt - lel;
    earningsPTtoUEL = uel - pt;
    earningsAboveUEL = monthlySalary - uel;
  }
  
  // Calculate earnings above ST (Secondary Threshold) for employer NIC
  earningsAboveST = Math.max(0, monthlySalary - st);
  
  // Validation - ensure all earnings bands add up to the total salary
  const totalEarnings = earningsAtLEL + earningsLELtoPT + earningsPTtoUEL + earningsAboveUEL;
  if (Math.abs(totalEarnings - monthlySalary) > 0.01) {
    payrollLogger.warn('NIC earnings bands sum mismatch', {
      belowLEL: monthlySalary <= lel,
      belowPT: monthlySalary <= pt,
      belowUEL: monthlySalary <= uel,
    }, 'NI_CALC');
  }
  
  return {
    earningsAtLEL: roundToTwoDecimals(earningsAtLEL),
    earningsLELtoPT: roundToTwoDecimals(earningsLELtoPT),
    earningsPTtoUEL: roundToTwoDecimals(earningsPTtoUEL),
    earningsAboveUEL: roundToTwoDecimals(earningsAboveUEL),
    earningsAboveST: roundToTwoDecimals(earningsAboveST)
  };
}

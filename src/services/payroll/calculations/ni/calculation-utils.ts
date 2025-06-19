import { roundToTwoDecimals } from "@/lib/formatters";
import { NICalculationResult, NICBand } from "./types";
import { NI_THRESHOLDS, NI_RATES } from "../../constants/tax-constants";

/**
 * Calculate NIC earnings bands according to HMRC reporting rules
 * This ensures proper reporting of earnings bands while maintaining correct NIC calculations
 */
function calculateNICEarningsBands(
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

/**
 * Calculate NI bands and contributions based on database bands
 */
export function calculateFromBands(
  monthlySalary: number, 
  niBands: NICBand[]
): NICalculationResult {
  console.log("[NI DEBUG] Using NI bands from database:", niBands);

  // Initialize result with zeros
  const result: NICalculationResult = {
    nationalInsurance: 0,
    earningsAtLEL: 0,
    earningsLELtoPT: 0,
    earningsPTtoUEL: 0,
    earningsAboveUEL: 0,
    earningsAboveST: 0
  };
  
  // First process employee bands
  const employeeBands = niBands.filter(band => band.contribution_type === 'Employee');
  console.log("[NI DEBUG] Employee bands:", employeeBands);
  
  // Find the LEL, PT, and UEL thresholds
  const lelBand = employeeBands.find(band => band.name.includes('LEL') && !band.name.includes('to'));
  const lelToPTBand = employeeBands.find(band => band.name.includes('LEL to PT'));
  const ptToUELBand = employeeBands.find(band => band.name.includes('PT to UEL'));
  const aboveUELBand = employeeBands.find(band => band.name.includes('Above UEL'));
  
  if (lelBand && lelToPTBand && ptToUELBand && aboveUELBand) {
    // Convert from pennies to pounds
    const lel = lelBand.threshold_to ? lelBand.threshold_to / 100 : lelBand.threshold_from / 100;
    const pt = lelToPTBand.threshold_to ? lelToPTBand.threshold_to / 100 : ptToUELBand.threshold_from / 100;
    const uel = ptToUELBand.threshold_to ? ptToUELBand.threshold_to / 100 : aboveUELBand.threshold_from / 100;
    
    console.log(`[NI DEBUG] NI thresholds in pounds: LEL: £${lel}, PT: £${pt}, UEL: £${uel}`);
    console.log(`[NI DEBUG] Monthly salary: £${monthlySalary}`);
    
    // Get Secondary Threshold from employer bands
    const employerBands = niBands.filter(band => band.contribution_type === 'Employer');
    const stBand = employerBands.find(band => band.name.includes('Above ST'));
    const st = stBand ? stBand.threshold_from / 100 : pt; // Default to PT if ST not found
    
    // Calculate correct NIC earnings bands using the new logic
    const earningsBands = calculateNICEarningsBands(monthlySalary, lel, pt, uel, st);
    
    // Apply the calculated bands to the result
    result.earningsAtLEL = earningsBands.earningsAtLEL;
    result.earningsLELtoPT = earningsBands.earningsLELtoPT;
    result.earningsPTtoUEL = earningsBands.earningsPTtoUEL;
    result.earningsAboveUEL = earningsBands.earningsAboveUEL;
    result.earningsAboveST = earningsBands.earningsAboveST;
    
    // Calculate NI contributions based on bands with rates (unchanged logic)
    // PT to UEL contribution (typically 12%)
    if (result.earningsPTtoUEL > 0) {
      const ptToUELRate = ptToUELBand.rate;
      console.log(`[NI DEBUG] PT to UEL rate: ${ptToUELRate} for earnings: £${result.earningsPTtoUEL}`);
      
      const ptToUELContribution = result.earningsPTtoUEL * ptToUELRate;
      console.log(`[NI DEBUG] PT to UEL contribution calculation: £${result.earningsPTtoUEL} × ${ptToUELRate} = £${ptToUELContribution}`);
      result.nationalInsurance += ptToUELContribution;
    } else {
      console.log(`[NI DEBUG] No contribution for PT to UEL band - earnings: £${result.earningsPTtoUEL}`);
    }
    
    // Above UEL contribution (typically 2%)
    if (result.earningsAboveUEL > 0) {
      const aboveUELRate = aboveUELBand.rate;
      console.log(`[NI DEBUG] Above UEL rate: ${aboveUELRate} for earnings: £${result.earningsAboveUEL}`);
      
      const aboveUELContribution = result.earningsAboveUEL * aboveUELRate;
      console.log(`[NI DEBUG] Above UEL contribution calculation: £${result.earningsAboveUEL} × ${aboveUELRate} = £${aboveUELContribution}`);
      result.nationalInsurance += aboveUELContribution;
    } else {
      console.log(`[NI DEBUG] No contribution for Above UEL band - earnings: £${result.earningsAboveUEL}`);
    }
    
    console.log(`[NI DEBUG] Final calculated earnings bands: 
      - LEL: £${result.earningsAtLEL} 
      - LEL to PT: £${result.earningsLELtoPT} 
      - PT to UEL: £${result.earningsPTtoUEL} 
      - Above UEL: £${result.earningsAboveUEL}
      - Above ST: £${result.earningsAboveST}
      - Total NI: £${result.nationalInsurance}`);
  } else {
    console.log("[NI DEBUG] Could not find all required NI bands. Using fallback calculation.");
    return null;
  }
  
  result.nationalInsurance = roundToTwoDecimals(result.nationalInsurance);
  console.log(`[NI DEBUG] Final NI contribution: £${result.nationalInsurance}`);
  return result;
}

/**
 * Fallback calculation using constants when database values are not available
 */
export function calculateNationalInsuranceFallback(monthlySalary: number): NICalculationResult {
  console.log(`[NI DEBUG] Using fallback NI calculation for salary: £${monthlySalary}`);
  
  // Define the thresholds using the available constants
  const primaryThreshold = NI_THRESHOLDS.PRIMARY_THRESHOLD.monthly;
  const lowerEarningsLimit = NI_THRESHOLDS.LOWER_EARNINGS_LIMIT.monthly;
  const upperLimit = NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.monthly;
  const secondaryThreshold = NI_THRESHOLDS.SECONDARY_THRESHOLD.monthly;
  
  console.log(`[NI DEBUG] Fallback thresholds - LEL: £${lowerEarningsLimit}, PT: £${primaryThreshold}, UEL: £${upperLimit}, ST: ${secondaryThreshold}`);
  
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
  
  console.log(`[NI DEBUG] Earnings bands from fallback calculation:
    - LEL: £${result.earningsAtLEL}
    - LEL to PT: £${result.earningsLELtoPT}
    - PT to UEL: £${result.earningsPTtoUEL}
    - Above UEL: £${result.earningsAboveUEL}
    - Above ST: ${result.earningsAboveST}
  `);
  
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


import { roundToTwoDecimals } from "@/lib/formatters";
import { NICalculationResult, NICBand } from "./types";
import { NI_THRESHOLDS, NI_RATES } from "../../constants/tax-constants";

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
    console.log(`[NI DEBUG] Is salary above LEL? ${monthlySalary > lel ? 'YES' : 'NO'}`);
    console.log(`[NI DEBUG] Is salary above PT? ${monthlySalary > pt ? 'YES' : 'NO'}`);
    console.log(`[NI DEBUG] Is salary above UEL? ${monthlySalary > uel ? 'YES' : 'NO'}`);
    
    // FIXED: Calculate earnings in each band correctly
    // LEL band - earnings up to the LEL threshold
    result.earningsAtLEL = Math.min(monthlySalary, lel);
    
    // LEL to PT band - earnings between LEL and PT thresholds
    result.earningsLELtoPT = monthlySalary > lel ? 
      Math.min(monthlySalary, pt) - lel : 0;
    
    // PT to UEL band - earnings between PT and UEL thresholds
    result.earningsPTtoUEL = monthlySalary > pt ? 
      Math.min(monthlySalary, uel) - pt : 0;
    
    // Above UEL band - earnings above the UEL threshold
    result.earningsAboveUEL = monthlySalary > uel ? 
      monthlySalary - uel : 0;
    
    // Validation - ensure all earnings bands add up to the total salary (allowing for small rounding errors)
    const totalEarnings = result.earningsAtLEL + result.earningsLELtoPT + 
                        result.earningsPTtoUEL + result.earningsAboveUEL;
    
    if (Math.abs(totalEarnings - monthlySalary) > 0.01) {
      console.warn(`[NI WARNING] Earnings bands don't sum to total salary. Total: £${totalEarnings}, Salary: £${monthlySalary}`);
      console.warn(`[NI WARNING] Bands: LEL: £${result.earningsAtLEL}, LEL to PT: £${result.earningsLELtoPT}, PT to UEL: £${result.earningsPTtoUEL}, Above UEL: £${result.earningsAboveUEL}`);
      
      // Adjust the highest band to correct the total
      // This ensures the earnings breakdown is always accurate
      const adjustment = monthlySalary - totalEarnings;
      
      if (result.earningsAboveUEL > 0) {
        result.earningsAboveUEL += adjustment;
      } else if (result.earningsPTtoUEL > 0) {
        result.earningsPTtoUEL += adjustment;
      } else if (result.earningsLELtoPT > 0) {
        result.earningsLELtoPT += adjustment;
      } else {
        result.earningsAtLEL += adjustment;
      }
      
      console.log(`[NI DEBUG] Applied adjustment of £${adjustment} to fix band totals`);
    }
    
    // Calculate NI contributions based on bands with rates
    // PT to UEL contribution (typically 12%)
    if (result.earningsPTtoUEL > 0) {
      // Get the rate from the band data
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
      // Get the rate from the band data
      const aboveUELRate = aboveUELBand.rate;
      console.log(`[NI DEBUG] Above UEL rate: ${aboveUELRate} for earnings: £${result.earningsAboveUEL}`);
      
      const aboveUELContribution = result.earningsAboveUEL * aboveUELRate;
      console.log(`[NI DEBUG] Above UEL contribution calculation: £${result.earningsAboveUEL} × ${aboveUELRate} = £${aboveUELContribution}`);
      result.nationalInsurance += aboveUELContribution;
    } else {
      console.log(`[NI DEBUG] No contribution for Above UEL band - earnings: £${result.earningsAboveUEL}`);
    }
    
    console.log(`[NI DEBUG] Calculated earnings in each band: 
      - LEL: £${result.earningsAtLEL} 
      - LEL to PT: £${result.earningsLELtoPT} 
      - PT to UEL: £${result.earningsPTtoUEL} 
      - Above UEL: £${result.earningsAboveUEL}
      - Total NI: £${result.nationalInsurance}`);
  } else {
    console.log("[NI DEBUG] Could not find all required NI bands. Using fallback calculation.");
    return null;
  }
  
  // Process employer bands to calculate earningsAboveST
  const employerBands = niBands.filter(band => band.contribution_type === 'Employer');
  const stBand = employerBands.find(band => band.name.includes('Above ST'));
  
  if (stBand) {
    const stThreshold = stBand.threshold_from / 100;
    result.earningsAboveST = Math.max(0, monthlySalary - stThreshold);
    console.log(`[NI DEBUG] Secondary Threshold: £${stThreshold}, Earnings above ST: £${result.earningsAboveST}`);
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
  
  // FIXED: Calculate earnings bands correctly using the same logic as above
  const result: NICalculationResult = {
    nationalInsurance: 0,
    // LEL band - earnings up to the LEL threshold
    earningsAtLEL: Math.min(monthlySalary, lowerEarningsLimit),
    // LEL to PT band - earnings between LEL and PT thresholds
    earningsLELtoPT: monthlySalary > lowerEarningsLimit ? 
      Math.min(monthlySalary, primaryThreshold) - lowerEarningsLimit : 0,
    // PT to UEL band - earnings between PT and UEL thresholds
    earningsPTtoUEL: monthlySalary > primaryThreshold ? 
      Math.min(monthlySalary, upperLimit) - primaryThreshold : 0,
    // Above UEL band - earnings above the UEL threshold
    earningsAboveUEL: monthlySalary > upperLimit ? 
      monthlySalary - upperLimit : 0,
    // Above ST band - earnings above the Secondary Threshold
    earningsAboveST: monthlySalary > secondaryThreshold ? 
      monthlySalary - secondaryThreshold : 0
  };
  
  console.log(`[NI DEBUG] Earnings bands from fallback calculation:
    - LEL: £${result.earningsAtLEL}
    - LEL to PT: £${result.earningsLELtoPT}
    - PT to UEL: £${result.earningsPTtoUEL}
    - Above UEL: £${result.earningsAboveUEL}
    - Above ST: ${result.earningsAboveST}
  `);
  
  // Validation - ensure all earnings bands add up to the total salary
  const totalEarnings = result.earningsAtLEL + result.earningsLELtoPT + 
                        result.earningsPTtoUEL + result.earningsAboveUEL;
  
  if (Math.abs(totalEarnings - monthlySalary) > 0.01) {
    console.warn(`[NI WARNING] Fallback earnings bands don't sum to total salary: ${totalEarnings} vs ${monthlySalary}`);
    // Apply an adjustment to fix the total
    const adjustment = monthlySalary - totalEarnings;
    
    if (result.earningsAboveUEL > 0) {
      result.earningsAboveUEL += adjustment;
    } else if (result.earningsPTtoUEL > 0) {
      result.earningsPTtoUEL += adjustment;
    } else if (result.earningsLELtoPT > 0) {
      result.earningsLELtoPT += adjustment;
    } else {
      result.earningsAtLEL += adjustment;
    }
  }
  
  // Calculate NI - Main rate (12%) between PT and UEL
  if (result.earningsPTtoUEL > 0) {
    const mainRateContribution = result.earningsPTtoUEL * NI_RATES.MAIN_RATE;
    console.log(`[NI DEBUG] Main rate contribution: £${mainRateContribution} (£${result.earningsPTtoUEL} × ${NI_RATES.MAIN_RATE})`);
    result.nationalInsurance += mainRateContribution;
  }
  
  // Higher rate (2%) above UEL
  if (result.earningsAboveUEL > 0) {
    const higherRateContribution = result.earningsAboveUEL * NI_RATES.HIGHER_RATE;
    console.log(`[NI DEBUG] Higher rate contribution: £${higherRateContribution} (£${result.earningsAboveUEL} × ${NI_RATES.HIGHER_RATE})`);
    result.nationalInsurance += higherRateContribution;
  }
  
  result.nationalInsurance = roundToTwoDecimals(result.nationalInsurance);
  console.log(`[NI DEBUG] Total fallback NI: £${result.nationalInsurance}`);
  
  return result;
}

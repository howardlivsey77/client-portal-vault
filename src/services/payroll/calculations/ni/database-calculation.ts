import { roundToTwoDecimals } from "@/lib/formatters";
import { NICalculationResult, NICBand } from "./types";
import { calculateNICEarningsBands } from "./earnings-bands";

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

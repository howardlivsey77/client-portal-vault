import { roundToTwoDecimals } from "@/lib/formatters";
import { NICalculationResult, NICBand } from "./types";
import { calculateNICEarningsBands } from "./earnings-bands";
import { NI_RATES } from "../../constants/tax-constants";

/**
 * Calculate NI bands and contributions based on database bands
 * 
 * Uses 2025/26 and 2026/27 NI rates:
 * - Employee: 8% between PT and UEL, 2% above UEL
 * - Employer: 15% above ST
 */
export function calculateFromBands(
  monthlySalary: number, 
  niBands: NICBand[]
): NICalculationResult | null {
  console.log("[NI DEBUG] Using NI bands from database:", niBands);

  // Initialize result with zeros
  const result: NICalculationResult = {
    nationalInsurance: 0,
    employerNationalInsurance: 0,
    earningsAtLEL: 0,
    earningsLELtoPT: 0,
    earningsPTtoUEL: 0,
    earningsAboveUEL: 0,
    earningsAboveST: 0
  };
  
  // First process employee bands
  const employeeBands = niBands.filter(band => band.contribution_type === 'Employee');
  console.log("[NI DEBUG] Employee bands:", employeeBands);
  
  // Find the LEL, PT, and UEL thresholds - FIXED LOGIC
  const lelBand = employeeBands.find(band => band.name.includes('LEL') && !band.name.includes('to'));
  const lelToPTBand = employeeBands.find(band => band.name.includes('LEL to PT'));
  const ptToUELBand = employeeBands.find(band => band.name.includes('PT to UEL'));
  const aboveUELBand = employeeBands.find(band => band.name.includes('Above UEL'));
  
  console.log("[NI DEBUG] Found bands:", {
    lelBand: lelBand ? `${lelBand.name}: ${lelBand.threshold_from}-${lelBand.threshold_to}` : 'NOT FOUND',
    lelToPTBand: lelToPTBand ? `${lelToPTBand.name}: ${lelToPTBand.threshold_from}-${lelToPTBand.threshold_to}` : 'NOT FOUND',
    ptToUELBand: ptToUELBand ? `${ptToUELBand.name}: ${ptToUELBand.threshold_from}-${ptToUELBand.threshold_to}` : 'NOT FOUND',
    aboveUELBand: aboveUELBand ? `${aboveUELBand.name}: ${aboveUELBand.threshold_from}-${aboveUELBand.threshold_to}` : 'NOT FOUND'
  });
  
  if (lelBand && lelToPTBand && ptToUELBand && aboveUELBand) {
    // FIXED: Extract thresholds correctly from database bands
    // LEL threshold should be threshold_to of LEL band (54200 pennies = £542)
    const lel = lelBand.threshold_to ? lelBand.threshold_to / 100 : 542;
    
    // PT threshold should be threshold_to of LEL to PT band OR threshold_from of PT to UEL band
    const pt = lelToPTBand.threshold_to ? lelToPTBand.threshold_to / 100 : 
               (ptToUELBand.threshold_from ? ptToUELBand.threshold_from / 100 : 1048);
    
    // UEL threshold should be threshold_to of PT to UEL band OR threshold_from of Above UEL band
    const uel = ptToUELBand.threshold_to ? ptToUELBand.threshold_to / 100 : 
                (aboveUELBand.threshold_from ? aboveUELBand.threshold_from / 100 : 4189);
    
    console.log(`[NI DEBUG] EXTRACTED thresholds in pounds: LEL: £${lel}, PT: £${pt}, UEL: £${uel}`);
    console.log(`[NI DEBUG] Monthly salary: £${monthlySalary}`);
    
    // VALIDATION: Check if thresholds are correct for 2025/26
    if (lel !== 542) {
      console.warn(`[NI DEBUG] WARNING: LEL should be £542 for 2025/26, but got £${lel}`);
    }
    if (pt !== 1048) {
      console.warn(`[NI DEBUG] WARNING: PT should be £1048 for 2025/26, but got £${pt}`);
    }
    if (uel !== 4189) {
      console.warn(`[NI DEBUG] WARNING: UEL should be £4189 for 2025/26, but got £${uel}`);
    }
    
    // Get Secondary Threshold from employer bands - default to £417 for 2025/26
    const employerBands = niBands.filter(band => band.contribution_type === 'Employer');
    const stBand = employerBands.find(band => band.name.includes('Above ST'));
    const st = stBand ? stBand.threshold_from / 100 : 417; // Default to correct 2025/26 ST
    
    console.log(`[NI DEBUG] Secondary Threshold: £${st}`);
    
    // Calculate correct NIC earnings bands using the fixed logic
    const earningsBands = calculateNICEarningsBands(monthlySalary, lel, pt, uel, st);
    
    // Apply the calculated bands to the result
    result.earningsAtLEL = earningsBands.earningsAtLEL;
    result.earningsLELtoPT = earningsBands.earningsLELtoPT;
    result.earningsPTtoUEL = earningsBands.earningsPTtoUEL;
    result.earningsAboveUEL = earningsBands.earningsAboveUEL;
    result.earningsAboveST = earningsBands.earningsAboveST;
    
    console.log(`[NI DEBUG] Calculated earnings bands:
      - LEL: £${result.earningsAtLEL}
      - LEL to PT: £${result.earningsLELtoPT}
      - PT to UEL: £${result.earningsPTtoUEL}
      - Above UEL: £${result.earningsAboveUEL}
      - Above ST: £${result.earningsAboveST}
    `);
    
    // Calculate NI contributions using database rates or fallback to constants
    // Employee: PT to UEL contribution (8%)
    if (result.earningsPTtoUEL > 0) {
      const ptToUELRate = ptToUELBand.rate || NI_RATES.EMPLOYEE_MAIN_RATE;
      console.log(`[NI DEBUG] PT to UEL rate: ${ptToUELRate} for earnings: £${result.earningsPTtoUEL}`);
      
      const ptToUELContribution = result.earningsPTtoUEL * ptToUELRate;
      console.log(`[NI DEBUG] PT to UEL contribution: £${ptToUELContribution}`);
      result.nationalInsurance += ptToUELContribution;
    }
    
    // Employee: Above UEL contribution (2%)
    if (result.earningsAboveUEL > 0) {
      const aboveUELRate = aboveUELBand.rate || NI_RATES.EMPLOYEE_HIGHER_RATE;
      console.log(`[NI DEBUG] Above UEL rate: ${aboveUELRate} for earnings: £${result.earningsAboveUEL}`);
      
      const aboveUELContribution = result.earningsAboveUEL * aboveUELRate;
      console.log(`[NI DEBUG] Above UEL contribution: £${aboveUELContribution}`);
      result.nationalInsurance += aboveUELContribution;
    }
    
    // Employer: Above ST contribution (15%)
    if (result.earningsAboveST > 0) {
      const employerRate = stBand?.rate || NI_RATES.EMPLOYER_RATE;
      result.employerNationalInsurance = roundToTwoDecimals(
        result.earningsAboveST * employerRate
      );
      console.log(`[NI DEBUG] Employer NI: £${result.employerNationalInsurance} (£${result.earningsAboveST} × ${employerRate})`);
    }
    
    console.log(`[NI DEBUG] Final: Employee NI: £${result.nationalInsurance}, Employer NI: £${result.employerNationalInsurance}`);
  } else {
    console.log("[NI DEBUG] Could not find all required NI bands. Missing bands:");
    if (!lelBand) console.log("- LEL band missing");
    if (!lelToPTBand) console.log("- LEL to PT band missing");
    if (!ptToUELBand) console.log("- PT to UEL band missing");
    if (!aboveUELBand) console.log("- Above UEL band missing");
    console.log("[NI DEBUG] Using fallback calculation.");
    return null;
  }
  
  result.nationalInsurance = roundToTwoDecimals(result.nationalInsurance);
  console.log(`[NI DEBUG] Final Employee NI contribution: £${result.nationalInsurance}`);
  return result;
}

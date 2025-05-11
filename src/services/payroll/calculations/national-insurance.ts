
import { NI_THRESHOLDS, NI_RATES } from "../constants/tax-constants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";

interface NICBand {
  name: string;
  threshold_from: number;
  threshold_to: number | null;
  rate: number;
  contribution_type: string;
}

export interface NICalculationResult {
  nationalInsurance: number;
  earningsAtLEL: number;
  earningsLELtoPT: number;
  earningsPTtoUEL: number;
  earningsAboveUEL: number;
  earningsAboveST: number;
}

/**
 * Fetch NI bands from the database
 */
async function fetchNIBands(taxYear: string = '2025/26'): Promise<NICBand[]> {
  try {
    const { data, error } = await supabase
      .from('nic_bands')
      .select('name, threshold_from, threshold_to, rate, contribution_type')
      .eq('tax_year', taxYear)
      .order('threshold_from', { ascending: true });
      
    if (error) {
      console.error("Error fetching NI bands:", error);
      // Fall back to constants if DB fetch fails
      return [];
    }
    
    console.log("Fetched NI bands from database:", data);
    return data || [];
  } catch (e) {
    console.error("Exception fetching NI bands:", e);
    return [];
  }
}

/**
 * Calculate National Insurance contributions using database values when available
 */
export async function calculateNationalInsuranceAsync(monthlySalary: number, taxYear: string = '2025/26'): Promise<NICalculationResult> {
  try {
    console.log(`[NI DEBUG] Calculating NI for monthly salary: £${monthlySalary}`);
    
    // Fetch NI bands from the database
    const niBands = await fetchNIBands(taxYear);
    
    // Initialize result with zeros
    const result: NICalculationResult = {
      nationalInsurance: 0,
      earningsAtLEL: 0,
      earningsLELtoPT: 0,
      earningsPTtoUEL: 0,
      earningsAboveUEL: 0,
      earningsAboveST: 0
    };
    
    // If we successfully got bands from database, use those
    if (niBands && niBands.length > 0) {
      console.log("[NI DEBUG] Using NI bands from database:", niBands);
      
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
        console.log(`[NI DEBUG] Monthly salary: £${monthlySalary}, PT threshold: £${pt}`);
        console.log(`[NI DEBUG] Is salary above PT? ${monthlySalary > pt ? 'YES' : 'NO'}`);
        
        // Calculate earnings in each band
        // LEL band
        result.earningsAtLEL = Math.min(monthlySalary, lel);
        
        // LEL to PT band (this was missing/wrong before)
        result.earningsLELtoPT = monthlySalary > lel ? Math.min(monthlySalary, pt) - lel : 0;
        
        // PT to UEL band
        result.earningsPTtoUEL = monthlySalary > pt ? Math.min(monthlySalary, uel) - pt : 0;
        
        // Above UEL band
        result.earningsAboveUEL = monthlySalary > uel ? monthlySalary - uel : 0;
        
        // Calculate NI contributions based on bands with rates
        if (ptToUELBand.rate > 0 && result.earningsPTtoUEL > 0) {
          const ptToUELContribution = result.earningsPTtoUEL * ptToUELBand.rate;
          console.log(`[NI DEBUG] PT to UEL contribution: £${ptToUELContribution} (£${result.earningsPTtoUEL} × ${ptToUELBand.rate})`);
          result.nationalInsurance += ptToUELContribution;
        } else {
          console.log(`[NI DEBUG] No contribution for PT to UEL band - rate: ${ptToUELBand.rate}, earnings: £${result.earningsPTtoUEL}`);
        }
        
        if (aboveUELBand.rate > 0 && result.earningsAboveUEL > 0) {
          const aboveUELContribution = result.earningsAboveUEL * aboveUELBand.rate;
          console.log(`[NI DEBUG] Above UEL contribution: £${aboveUELContribution} (£${result.earningsAboveUEL} × ${aboveUELBand.rate})`);
          result.nationalInsurance += aboveUELContribution;
        } else {
          console.log(`[NI DEBUG] No contribution for Above UEL band - rate: ${aboveUELBand.rate}, earnings: £${result.earningsAboveUEL}`);
        }
        
        console.log(`[NI DEBUG] Calculated earnings in each band: 
          - LEL: £${result.earningsAtLEL} 
          - LEL to PT: £${result.earningsLELtoPT} 
          - PT to UEL: £${result.earningsPTtoUEL} 
          - Above UEL: £${result.earningsAboveUEL}
          - Total NI: £${result.nationalInsurance}`);
      } else {
        console.log("[NI DEBUG] Could not find all required NI bands. Using fallback calculation.");
      }
      
      // Process employer bands to calculate earningsAboveST
      const employerBands = niBands.filter(band => band.contribution_type === 'Employer');
      const stBand = employerBands.find(band => band.name.includes('Above ST'));
      
      if (stBand) {
        const stThreshold = stBand.threshold_from / 100;
        result.earningsAboveST = Math.max(0, monthlySalary - stThreshold);
      }
      
      result.nationalInsurance = roundToTwoDecimals(result.nationalInsurance);
      console.log(`[NI DEBUG] Final NI contribution: £${result.nationalInsurance}`);
      return result;
    } else {
      console.log("[NI DEBUG] No NI bands from database, using fallback constants-based calculation");
    }
    
    // Fall back to constants-based calculation if DB fetch fails
    const fallbackResult = calculateNationalInsurance(monthlySalary);
    console.log(`[NI DEBUG] Fallback calculation result: £${fallbackResult}`);
    return {
      nationalInsurance: fallbackResult,
      earningsAtLEL: 0, // We don't have detailed band information in the fallback
      earningsLELtoPT: 0,
      earningsPTtoUEL: 0,
      earningsAboveUEL: 0,
      earningsAboveST: 0
    };
  } catch (error) {
    console.error("[NI DEBUG] Error in calculateNationalInsuranceAsync:", error);
    // Fall back to constants-based calculation
    const fallbackResult = calculateNationalInsurance(monthlySalary);
    console.log(`[NI DEBUG] Fallback calculation after error: £${fallbackResult}`);
    return {
      nationalInsurance: fallbackResult,
      earningsAtLEL: 0,
      earningsLELtoPT: 0,
      earningsPTtoUEL: 0,
      earningsAboveUEL: 0,
      earningsAboveST: 0
    };
  }
}

/**
 * Calculate National Insurance contributions using constants
 * (Legacy method, kept for fallback)
 */
export function calculateNationalInsurance(monthlySalary: number): number {
  const primaryThreshold = NI_THRESHOLDS.PRIMARY_THRESHOLD.monthly;
  const upperLimit = NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.monthly;
  
  console.log(`[NI DEBUG] Fallback calculation with constants - PT: £${primaryThreshold}, UEL: £${upperLimit}`);
  console.log(`[NI DEBUG] Salary: £${monthlySalary}, Is above PT? ${monthlySalary > primaryThreshold ? 'YES' : 'NO'}`);
  
  let ni = 0;
  
  // Main rate between primary threshold and upper earnings limit
  if (monthlySalary > primaryThreshold) {
    const mainRatePortion = Math.min(monthlySalary, upperLimit) - primaryThreshold;
    const mainRateNI = mainRatePortion * NI_RATES.MAIN_RATE;
    console.log(`[NI DEBUG] Main rate contribution: £${mainRateNI} (£${mainRatePortion} × ${NI_RATES.MAIN_RATE})`);
    ni += mainRateNI;
    
    // Higher rate above upper earnings limit
    if (monthlySalary > upperLimit) {
      const higherRatePortion = monthlySalary - upperLimit;
      const higherRateNI = higherRatePortion * NI_RATES.HIGHER_RATE;
      console.log(`[NI DEBUG] Higher rate contribution: £${higherRateNI} (£${higherRatePortion} × ${NI_RATES.HIGHER_RATE})`);
      ni += higherRateNI;
    }
  } else {
    console.log(`[NI DEBUG] No NI contribution as salary is below primary threshold`);
  }
  
  console.log(`[NI DEBUG] Total fallback NI: £${ni}`);
  return roundToTwoDecimals(ni);
}

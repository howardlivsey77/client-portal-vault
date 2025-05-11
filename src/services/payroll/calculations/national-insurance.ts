
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
        console.log(`[NI DEBUG] Monthly salary: £${monthlySalary}`);
        console.log(`[NI DEBUG] Is salary above LEL? ${monthlySalary > lel ? 'YES' : 'NO'}`);
        console.log(`[NI DEBUG] Is salary above PT? ${monthlySalary > pt ? 'YES' : 'NO'}`);
        console.log(`[NI DEBUG] Is salary above UEL? ${monthlySalary > uel ? 'YES' : 'NO'}`);
        
        // Calculate earnings in each band
        // LEL band
        result.earningsAtLEL = Math.min(monthlySalary, lel);
        
        // LEL to PT band
        result.earningsLELtoPT = monthlySalary > lel ? Math.min(monthlySalary, pt) - lel : 0;
        
        // PT to UEL band
        result.earningsPTtoUEL = monthlySalary > pt ? Math.min(monthlySalary, uel) - pt : 0;
        
        // Above UEL band
        result.earningsAboveUEL = monthlySalary > uel ? monthlySalary - uel : 0;
        
        // Calculate NI contributions based on bands with rates
        // PT to UEL contribution (12% in 2023/24)
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
        
        // Above UEL contribution (2% in 2023/24)
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
    } else {
      console.log("[NI DEBUG] No NI bands from database, using fallback constants-based calculation");
      return calculateNationalInsuranceFallback(monthlySalary);
    }
  } catch (error) {
    console.error("[NI DEBUG] Error in calculateNationalInsuranceAsync:", error);
    // Fall back to constants-based calculation
    return calculateNationalInsuranceFallback(monthlySalary);
  }
}

/**
 * Fallback calculation using constants when database values are not available
 */
function calculateNationalInsuranceFallback(monthlySalary: number): NICalculationResult {
  console.log(`[NI DEBUG] Using fallback NI calculation for salary: £${monthlySalary}`);
  
  const primaryThreshold = NI_THRESHOLDS.PRIMARY_THRESHOLD.monthly;
  const lowerEarningsLimit = NI_THRESHOLDS.LOWER_EARNINGS_LIMIT.monthly;
  const upperLimit = NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.monthly;
  const secondaryThreshold = NI_THRESHOLDS.SECONDARY_THRESHOLD.monthly;
  
  console.log(`[NI DEBUG] Fallback thresholds - LEL: £${lowerEarningsLimit}, PT: £${primaryThreshold}, UEL: £${upperLimit}, ST: £${secondaryThreshold}`);
  
  const result: NICalculationResult = {
    nationalInsurance: 0,
    earningsAtLEL: Math.min(monthlySalary, lowerEarningsLimit),
    earningsLELtoPT: monthlySalary > lowerEarningsLimit ? Math.min(monthlySalary, primaryThreshold) - lowerEarningsLimit : 0,
    earningsPTtoUEL: monthlySalary > primaryThreshold ? Math.min(monthlySalary, upperLimit) - primaryThreshold : 0,
    earningsAboveUEL: monthlySalary > upperLimit ? monthlySalary - upperLimit : 0,
    earningsAboveST: monthlySalary > secondaryThreshold ? monthlySalary - secondaryThreshold : 0
  };
  
  console.log(`[NI DEBUG] Earnings bands from fallback calculation:
    - LEL: £${result.earningsAtLEL}
    - LEL to PT: £${result.earningsLELtoPT}
    - PT to UEL: £${result.earningsPTtoUEL}
    - Above UEL: £${result.earningsAboveUEL}
    - Above ST: ${result.earningsAboveST}
  `);
  
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

/**
 * Calculate National Insurance contributions using constants
 * (Legacy method, kept for fallback)
 */
export function calculateNationalInsurance(monthlySalary: number): number {
  const niResult = calculateNationalInsuranceFallback(monthlySalary);
  return niResult.nationalInsurance;
}

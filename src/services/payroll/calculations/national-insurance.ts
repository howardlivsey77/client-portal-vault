
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

/**
 * Fetch NI bands from the database
 */
async function fetchNIBands(taxYear: string = '2025/26'): Promise<NICBand[]> {
  try {
    const { data, error } = await supabase
      .from('nic_bands')
      .select('name, threshold_from, threshold_to, rate, contribution_type')
      .eq('tax_year', taxYear)
      .eq('contribution_type', 'Employee')
      .order('threshold_from', { ascending: true });
      
    if (error) {
      console.error("Error fetching NI bands:", error);
      // Fall back to constants if DB fetch fails
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error("Exception fetching NI bands:", e);
    return [];
  }
}

/**
 * Calculate National Insurance contributions using database values when available
 */
export async function calculateNationalInsuranceAsync(monthlySalary: number, taxYear: string = '2025/26'): Promise<number> {
  try {
    // Fetch NI bands from the database
    const niBands = await fetchNIBands(taxYear);
    
    // If we successfully got bands from database, use those
    if (niBands && niBands.length > 0) {
      let ni = 0;
      
      for (const band of niBands) {
        if (band.rate > 0 && monthlySalary > band.threshold_from / 100) {
          // Calculate the portion of salary that falls within this band
          const lowerBound = band.threshold_from / 100;
          const upperBound = band.threshold_to ? band.threshold_to / 100 : Infinity;
          
          const amountInBand = Math.min(monthlySalary, upperBound) - lowerBound;
          
          if (amountInBand > 0) {
            ni += amountInBand * band.rate;
          }
        }
      }
      
      return roundToTwoDecimals(ni);
    }
    
    // Fall back to constants-based calculation if DB fetch fails
    return calculateNationalInsurance(monthlySalary);
  } catch (error) {
    console.error("Error in calculateNationalInsuranceAsync:", error);
    // Fall back to constants-based calculation
    return calculateNationalInsurance(monthlySalary);
  }
}

/**
 * Calculate National Insurance contributions using constants
 * (Legacy method, kept for fallback)
 */
export function calculateNationalInsurance(monthlySalary: number): number {
  const primaryThreshold = NI_THRESHOLDS.PRIMARY_THRESHOLD.monthly;
  const upperLimit = NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.monthly;
  
  let ni = 0;
  
  // Main rate between primary threshold and upper earnings limit
  if (monthlySalary > primaryThreshold) {
    const mainRatePortion = Math.min(monthlySalary, upperLimit) - primaryThreshold;
    ni += mainRatePortion * NI_RATES.MAIN_RATE;
    
    // Higher rate above upper earnings limit
    if (monthlySalary > upperLimit) {
      ni += (monthlySalary - upperLimit) * NI_RATES.HIGHER_RATE;
    }
  }
  
  return roundToTwoDecimals(ni);
}

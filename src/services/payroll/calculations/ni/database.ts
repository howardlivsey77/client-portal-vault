
import { supabase } from "@/integrations/supabase/client";
import { NICBand } from "./types";

/**
 * Get previous tax year in format YYYY/YY
 */
function getPreviousTaxYear(taxYear: string): string {
  const [startYear] = taxYear.split('/');
  const prevStart = parseInt(startYear) - 1;
  return `${prevStart}/${startYear.substring(2)}`;
}

/**
 * Fetch NI bands from the database with fallback to previous tax year
 */
export async function fetchNIBands(taxYear: string = '2025/26', attemptedFallback: boolean = false): Promise<NICBand[]> {
  try {
    const { data, error } = await supabase
      .from('nic_bands')
      .select('name, threshold_from, threshold_to, rate, contribution_type')
      .eq('tax_year', taxYear)
      .order('threshold_from', { ascending: true });
      
    if (error) {
      console.error("Error fetching NI bands:", error);
      return [];
    }
    
    // If no bands found for requested year and we haven't tried fallback yet, try previous year
    if ((!data || data.length === 0) && !attemptedFallback) {
      const previousYear = getPreviousTaxYear(taxYear);
      console.log(`No NI bands found for ${taxYear}, falling back to ${previousYear}`);
      return fetchNIBands(previousYear, true);
    }
    
    console.log(`Fetched NI bands from database for ${taxYear}:`, data);
    return data || [];
  } catch (e) {
    console.error("Exception fetching NI bands:", e);
    return [];
  }
}

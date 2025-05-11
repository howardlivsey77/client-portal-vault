
import { supabase } from "@/integrations/supabase/client";
import { NICBand } from "./types";

/**
 * Fetch NI bands from the database
 */
export async function fetchNIBands(taxYear: string = '2025/26'): Promise<NICBand[]> {
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


import { supabase } from "@/integrations/supabase/client";

/**
 * Service to fetch tax constants from the database
 */

export interface TaxConstant {
  id: string;
  category: string;
  key: string;
  value_numeric: number | null;
  value_text: string | null;
  description: string | null;
  effective_from: string;
  effective_to: string | null;
  is_current: boolean;
  region: string;
}

/**
 * Get all current tax constants by category and region
 */
export async function getTaxConstantsByCategory(
  category: string, 
  region: string = 'UK'
): Promise<TaxConstant[]> {
  const { data, error } = await supabase
    .from('payroll_constants')
    .select('*')
    .eq('category', category)
    .eq('is_current', true)
    .eq('region', region)
    .order('key');
  
  if (error) {
    console.error(`Error fetching ${category} constants for region ${region}:`, error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a specific tax constant by category, key, and region
 */
export async function getTaxConstant(
  category: string, 
  key: string, 
  region: string = 'UK'
): Promise<TaxConstant | null> {
  const { data, error } = await supabase
    .from('payroll_constants')
    .select('*')
    .eq('category', category)
    .eq('key', key)
    .eq('is_current', true)
    .eq('region', region)
    .single();
  
  if (error) {
    // Don't throw for not found, just return null
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error(`Error fetching constant ${category}.${key} for region ${region}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Fallback to use the hardcoded constants when database query fails
 */
export function getHardcodedTaxBands(region: string = 'UK') {
  if (region === 'Scotland') {
    return {
      PERSONAL_ALLOWANCE: { threshold: 12570, rate: 0 },
      STARTER_RATE: { threshold: 14732, rate: 0.19 },
      BASIC_RATE: { threshold: 25688, rate: 0.20 },
      INTERMEDIATE_RATE: { threshold: 43662, rate: 0.21 },
      HIGHER_RATE: { threshold: 125140, rate: 0.42 },
      ADDITIONAL_RATE: { threshold: Infinity, rate: 0.47 }
    };
  } else if (region === 'Wales') {
    // Currently same as UK/England
    return {
      PERSONAL_ALLOWANCE: { threshold: 12570, rate: 0 },
      BASIC_RATE: { threshold: 50270, rate: 0.20 },
      HIGHER_RATE: { threshold: 125140, rate: 0.40 },
      ADDITIONAL_RATE: { threshold: Infinity, rate: 0.45 }
    };
  } else {
    // UK/England default
    return {
      PERSONAL_ALLOWANCE: { threshold: 12570, rate: 0 },
      BASIC_RATE: { threshold: 50270, rate: 0.20 },
      HIGHER_RATE: { threshold: 125140, rate: 0.40 },
      ADDITIONAL_RATE: { threshold: Infinity, rate: 0.45 }
    };
  }
}

export function getHardcodedNIThresholds() {
  return {
    PRIMARY_THRESHOLD: { monthly: 1048, annual: 12570 },
    UPPER_EARNINGS_LIMIT: { monthly: 4189, annual: 50270 }
  };
}

export function getHardcodedNIRates() {
  return {
    MAIN_RATE: 0.12,
    HIGHER_RATE: 0.02
  };
}

export function getHardcodedStudentLoanThresholds() {
  return {
    1: { monthly: 1834.58, rate: 0.09 },
    2: { monthly: 2274.58, rate: 0.09 },
    4: { monthly: 2305, rate: 0.09 },
    5: { monthly: 2083.33, rate: 0.09 }
  };
}

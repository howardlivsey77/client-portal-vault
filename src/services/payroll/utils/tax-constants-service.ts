
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
}

/**
 * Get all current tax constants by category
 */
export async function getTaxConstantsByCategory(category: string): Promise<TaxConstant[]> {
  const { data, error } = await supabase
    .from('payroll_constants')
    .select('*')
    .eq('category', category)
    .eq('is_current', true)
    .order('key');
  
  if (error) {
    console.error(`Error fetching ${category} constants:`, error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a specific tax constant by category and key
 */
export async function getTaxConstant(category: string, key: string): Promise<TaxConstant | null> {
  const { data, error } = await supabase
    .from('payroll_constants')
    .select('*')
    .eq('category', category)
    .eq('key', key)
    .eq('is_current', true)
    .single();
  
  if (error) {
    // Don't throw for not found, just return null
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error(`Error fetching constant ${category}.${key}:`, error);
    throw error;
  }
  
  return data;
}

/**
 * Fallback to use the hardcoded constants when database query fails
 */
export function getHardcodedTaxBands() {
  return {
    PERSONAL_ALLOWANCE: { threshold: 12570, rate: 0 },
    BASIC_RATE: { threshold: 50270, rate: 0.20 },
    HIGHER_RATE: { threshold: 125140, rate: 0.40 },
    ADDITIONAL_RATE: { threshold: Infinity, rate: 0.45 }
  };
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

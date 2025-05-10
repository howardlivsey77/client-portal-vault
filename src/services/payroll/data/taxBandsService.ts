
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface for tax band data
 */
export interface TaxBand {
  id: string;
  name: string;
  threshold_from: number; // in pennies
  threshold_to: number | null; // in pennies
  rate: number; // decimal rate (e.g., 0.20 for 20%)
  region: string;
  taxYear: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isCurrent: boolean;
}

/**
 * Formatted tax bands for calculation
 */
export interface FormattedTaxBands {
  BASIC_RATE: { threshold_from: number; threshold_to: number | null; rate: number };
  HIGHER_RATE: { threshold_from: number; threshold_to: number | null; rate: number };
  ADDITIONAL_RATE: { threshold_from: number; threshold_to: number | null; rate: number };
}

/**
 * Default tax bands for fallback (2025/26 tax year)
 */
export const DEFAULT_TAX_BANDS: FormattedTaxBands = {
  BASIC_RATE: { threshold_from: 0, threshold_to: 3770000, rate: 0.20 },
  HIGHER_RATE: { threshold_from: 3770000, threshold_to: 12514000, rate: 0.40 },
  ADDITIONAL_RATE: { threshold_from: 12514000, threshold_to: null, rate: 0.45 }
};

/**
 * Cache for tax bands to reduce database calls
 */
const taxBandsCache = new Map<string, TaxBand[]>();

/**
 * Generate cache key for tax bands
 */
const generateCacheKey = (region: string, taxYear?: string, date?: Date): string => {
  const dateStr = date ? date.toISOString().split('T')[0] : 'current';
  const yearStr = taxYear || 'current';
  return `${region}-${yearStr}-${dateStr}`;
};

/**
 * Clear the tax bands cache
 */
export const clearTaxBandsCache = (): void => {
  taxBandsCache.clear();
};

/**
 * Get tax bands from the database
 */
export const fetchTaxBands = async (
  region: string = 'UK',
  taxYear?: string,
  date?: Date
): Promise<TaxBand[]> => {
  // Generate cache key
  const cacheKey = generateCacheKey(region, taxYear, date);
  
  // Check cache first
  if (taxBandsCache.has(cacheKey)) {
    return taxBandsCache.get(cacheKey) as TaxBand[];
  }
  
  try {
    // Using .from() with a string literal to work around TypeScript limitations
    // since the tax_bands table was just created and isn't in the generated types yet
    let query = supabase
      .from('tax_bands')
      .select('*')
      .eq('region', region)
      .order('threshold_from', { ascending: true });
    
    // Filter by tax year if provided
    if (taxYear) {
      query = query.eq('tax_year', taxYear);
    } else {
      query = query.eq('is_current', true);
    }
    
    // Filter by date if provided
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      query = query
        .lte('effective_from', dateStr)
        .or(`effective_to.is.null,effective_to.gte.${dateStr}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tax bands:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.warn('No tax bands found in database, using defaults');
      return [];
    }
    
    // Format the data - use type assertion since the table isn't in the generated types
    const taxBands: TaxBand[] = data.map(band => ({
      id: band.id,
      name: band.name,
      threshold_from: band.threshold_from,
      threshold_to: band.threshold_to,
      rate: Number(band.rate), // Convert from decimal to number
      region: band.region,
      taxYear: band.tax_year,
      effectiveFrom: new Date(band.effective_from),
      effectiveTo: band.effective_to ? new Date(band.effective_to) : null,
      isCurrent: band.is_current
    }));
    
    // Store in cache
    taxBandsCache.set(cacheKey, taxBands);
    
    return taxBands;
  } catch (error) {
    console.error('Error in fetchTaxBands:', error);
    return [];
  }
};

/**
 * Format tax bands for calculation
 */
export const formatTaxBandsForCalculation = (taxBands: TaxBand[]): FormattedTaxBands => {
  // Default structure with fallback values
  const formatted: FormattedTaxBands = { ...DEFAULT_TAX_BANDS };
  
  // Find the bands by name
  const basicRateBand = taxBands.find(band => band.name === 'Basic Rate');
  const higherRateBand = taxBands.find(band => band.name === 'Higher Rate');
  const additionalRateBand = taxBands.find(band => band.name === 'Additional Rate');
  
  // Update with actual values if found
  if (basicRateBand) {
    formatted.BASIC_RATE = { 
      threshold_from: basicRateBand.threshold_from, 
      threshold_to: basicRateBand.threshold_to,
      rate: basicRateBand.rate 
    };
  }
  
  if (higherRateBand) {
    formatted.HIGHER_RATE = { 
      threshold_from: higherRateBand.threshold_from, 
      threshold_to: higherRateBand.threshold_to,
      rate: higherRateBand.rate 
    };
  }
  
  if (additionalRateBand) {
    formatted.ADDITIONAL_RATE = { 
      threshold_from: additionalRateBand.threshold_from, 
      threshold_to: additionalRateBand.threshold_to,
      rate: additionalRateBand.rate 
    };
  }
  
  return formatted;
};

/**
 * Get tax bands ready for calculation
 * This is the main function to use in tax calculations
 */
export const getTaxBandsForCalculation = async (
  region: string = 'UK',
  taxYear?: string,
  date?: Date
): Promise<FormattedTaxBands> => {
  try {
    const taxBands = await fetchTaxBands(region, taxYear, date);
    
    if (taxBands.length === 0) {
      console.warn('No tax bands found, using default values');
      return DEFAULT_TAX_BANDS;
    }
    
    return formatTaxBandsForCalculation(taxBands);
  } catch (error) {
    console.error('Error getting tax bands for calculation:', error);
    return DEFAULT_TAX_BANDS;
  }
};

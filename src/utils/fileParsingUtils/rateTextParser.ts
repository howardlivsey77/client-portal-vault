
/**
 * Parse rate descriptions from payroll files and map them to employee rate fields
 */

export interface RateMapping {
  rateNumber: number;
  rateType: string;
}

/**
 * Parse rate description text and determine which employee rate field it maps to
 */
export function parseRateDescription(rateText: string): RateMapping | null {
  if (!rateText || typeof rateText !== 'string') {
    return null;
  }
  
  const normalizedText = rateText.toLowerCase().trim();
  
  // Standard Pay maps to rate_1 (Standard)
  if (normalizedText.includes('standard pay') || 
      normalizedText.includes('standard overtime') ||
      normalizedText.includes('standard access')) {
    return {
      rateNumber: 1,
      rateType: 'Rate 1'
    };
  }
  
  // Enhanced/Extended Access maps to rate_2 (Enhanced)
  if (normalizedText.includes('enhanced access') || 
      normalizedText.includes('extended access') ||
      normalizedText.includes('enhanced') ||
      normalizedText.includes('extended')) {
    return {
      rateNumber: 2,
      rateType: 'Rate 2'
    };
  }
  
  // Rate 4 variations
  if (normalizedText.includes('rate 4') || 
      normalizedText.includes('rate4') ||
      normalizedText.includes('r4')) {
    return {
      rateNumber: 4,
      rateType: 'Rate 4'
    };
  }
  
  // Default/basic rate (though this would be unusual for extra hours)
  if (normalizedText.includes('basic') || 
      normalizedText.includes('normal') ||
      normalizedText.includes('regular')) {
    return {
      rateNumber: 1,
      rateType: 'Rate 1'
    };
  }
  
  return null;
}

/**
 * Extract rate value from text if present (e.g., "£620 per hour" -> 620)
 */
export function extractRateValue(rateText: string): number | null {
  if (!rateText || typeof rateText !== 'string') {
    return null;
  }
  
  // Look for currency symbols followed by numbers
  const currencyPattern = /[£$€]?\s*(\d+(?:\.\d{2})?)/;
  const match = rateText.match(currencyPattern);
  
  if (match && match[1]) {
    const value = parseFloat(match[1]);
    return isNaN(value) ? null : value;
  }
  
  return null;
}

/**
 * Check if a column contains rate description information
 */
export function isRateDescriptionColumn(columnName: string): boolean {
  if (!columnName || typeof columnName !== 'string') {
    return false;
  }
  
  const normalizedName = columnName.toLowerCase().trim();
  
  return normalizedName.includes('pay rate') ||
         normalizedName.includes('rate type') ||
         normalizedName.includes('rate description') ||
         normalizedName.includes('rate_type') ||
         normalizedName.includes('payrate') ||
         normalizedName === 'rate';
}

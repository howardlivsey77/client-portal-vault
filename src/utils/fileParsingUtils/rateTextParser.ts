
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
  
  // Rate 4 explicit variations
  if (
    normalizedText.includes('rate 4') ||
    normalizedText.includes('rate4') ||
    normalizedText.includes('r4')
  ) {
    return { rateNumber: 4, rateType: 'Rate 4' };
  }

  // Enhanced Access -> Rate 3 (employee.rate_3)
  if (
    normalizedText.includes('enhanced access') ||
    normalizedText.includes('extended access') ||
    normalizedText.includes('enh access') ||
    normalizedText.includes('enh. access') ||
    normalizedText.includes('ea -') ||
    normalizedText.endsWith(' (ea)')
  ) {
    return { rateNumber: 3, rateType: 'Rate 3' };
  }

  // Overtime 1 (Standard Overtime) -> Rate 2 (employee.rate_2)
  const ot1Regex = /\bot\s*1\b/; // matches "ot1" or "ot 1"
  if (
    normalizedText.includes('overtime 1') ||
    normalizedText.includes('overtime1') ||
    ot1Regex.test(normalizedText) ||
    normalizedText.includes('standard overtime')
  ) {
    return { rateNumber: 2, rateType: 'Rate 2' };
  }

  // Standard/basic pay -> Rate 1 (employee.hourly_rate)
  if (
    normalizedText.includes('standard pay') ||
    normalizedText.includes('basic pay') ||
    normalizedText.includes('regular time') ||
    normalizedText.includes('normal time')
  ) {
    return { rateNumber: 1, rateType: 'Rate 1' };
  }

  // Explicit textual rate numbers as fallback
  if (
    normalizedText.includes('rate 3') ||
    normalizedText.includes('rate3') ||
    normalizedText.includes('r3')
  ) {
    return { rateNumber: 3, rateType: 'Rate 3' };
  }

  if (
    normalizedText.includes('rate 2') ||
    normalizedText.includes('rate2') ||
    normalizedText.includes('r2')
  ) {
    return { rateNumber: 2, rateType: 'Rate 2' };
  }

  if (
    normalizedText.includes('rate 1') ||
    normalizedText.includes('rate1') ||
    normalizedText.includes('r1')
  ) {
    return { rateNumber: 1, rateType: 'Rate 1' };
  }

  // Default/basic synonyms
  if (
    normalizedText.includes('basic') ||
    normalizedText.includes('normal') ||
    normalizedText.includes('regular')
  ) {
    return { rateNumber: 1, rateType: 'Rate 1' };
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
         normalizedName.includes('overtime type') ||
         normalizedName.includes('ot type') ||
         normalizedName.includes('overtime description') ||
         normalizedName.includes('ot description') ||
         normalizedName.includes('pay description') ||
         normalizedName.includes('pay code') ||
         normalizedName.includes('rate code') ||
         normalizedName === 'rate';
}

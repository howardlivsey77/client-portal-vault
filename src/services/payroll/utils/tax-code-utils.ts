
/**
 * Utilities for handling UK tax codes
 */

export interface TaxCode {
  code: string;
  allowance: number;
}

/**
 * Parse a UK tax code to determine the tax-free allowance
 */
export function parseTaxCode(taxCode: string): TaxCode {
  // Handle common tax code formats
  taxCode = taxCode.toUpperCase().trim();
  
  // Basic number-L code (e.g., 1257L)
  if (/^\d+L$/.test(taxCode)) {
    const numberPart = parseInt(taxCode.replace('L', ''), 10);
    return { code: taxCode, allowance: numberPart * 10 };
  }
  
  // BR code (basic rate on all income)
  if (taxCode === 'BR') {
    return { code: taxCode, allowance: 0 };
  }
  
  // NT code (no tax)
  if (taxCode === 'NT') {
    return { code: taxCode, allowance: Infinity };
  }
  
  // K codes (reduce personal allowance)
  if (/^K\d+$/.test(taxCode)) {
    const numberPart = parseInt(taxCode.replace('K', ''), 10);
    return { code: taxCode, allowance: -numberPart * 10 };
  }
  
  // Default to standard personal allowance if code not recognized
  return { 
    code: taxCode, 
    allowance: 12570 // Standard personal allowance for 2023-2024
  };
}

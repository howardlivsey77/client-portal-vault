
/**
 * Utilities for handling UK tax codes
 */

export interface TaxCode {
  code: string;
  allowance: number;  // Annual tax-free allowance in pounds
  monthlyAllowance: number; // Monthly tax-free allowance in pounds
}

/**
 * Parse a UK tax code to determine the tax-free allowance
 */
export function parseTaxCode(taxCode: string): TaxCode {
  // Handle common tax code formats
  taxCode = taxCode.toUpperCase().trim();
  
  // Remove any M1 (emergency tax) indicator for allowance calculation
  let cleanTaxCode = taxCode.replace(' M1', '');
  
  // Basic number-L code (e.g., 1257L)
  if (/^\d+L$/.test(cleanTaxCode)) {
    const numberPart = parseInt(cleanTaxCode.replace('L', ''), 10);
    const annualAllowance = numberPart * 10;
    return { 
      code: taxCode, 
      allowance: annualAllowance,
      monthlyAllowance: annualAllowance / 12
    };
  }
  
  // BR code (basic rate on all income)
  if (cleanTaxCode === 'BR') {
    return { 
      code: taxCode, 
      allowance: 0,
      monthlyAllowance: 0 
    };
  }
  
  // NT code (no tax)
  if (cleanTaxCode === 'NT') {
    return { 
      code: taxCode, 
      allowance: Infinity,
      monthlyAllowance: Infinity 
    };
  }
  
  // K codes (reduce personal allowance)
  if (/^K\d+$/.test(cleanTaxCode)) {
    const numberPart = parseInt(cleanTaxCode.replace('K', ''), 10);
    const annualAllowance = -numberPart * 10;
    return { 
      code: taxCode, 
      allowance: annualAllowance,
      monthlyAllowance: annualAllowance / 12
    };
  }
  
  // Default to standard personal allowance if code not recognized
  return { 
    code: taxCode, 
    allowance: 12570, // Standard personal allowance for 2023-2024
    monthlyAllowance: 12570 / 12 // Monthly standard allowance
  };
}

/**
 * Calculate tax-free amount for specific period based on tax code
 * @param taxCode The tax code (e.g., "1257L")
 * @param period Current tax period (1-12)
 * @param cumulative Whether to use cumulative calculation (false for Week1/Month1)
 * @returns Tax-free amount for the period
 */
export function calculateTaxFreeAmountForPeriod(
  taxCode: string, 
  period: number = 1, 
  cumulative: boolean = true
): number {
  const { allowance } = parseTaxCode(taxCode.replace(' M1', ''));
  
  // For Week1/Month1 basis (non-cumulative), only use current period
  if (!cumulative) {
    return allowance / 12;
  }
  
  // For cumulative basis, allowance is proportional to the number of periods
  return (allowance / 12) * period;
}

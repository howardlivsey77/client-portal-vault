
/**
 * Utilities for handling UK tax codes
 */

export interface TaxCode {
  code: string;
  allowance: number;  // Annual tax-free allowance in pounds
  monthlyAllowance: number; // Monthly tax-free allowance in pounds
}

// HMRC standard is to use 4.33 weeks per month for tax calculations
const WEEKS_PER_MONTH = 4.33;

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
    
    // Using HMRC weekly to monthly calculation method
    const monthlyAllowance = calculateMonthlyFreePay(cleanTaxCode);
    
    return { 
      code: taxCode, 
      allowance: annualAllowance,
      monthlyAllowance: monthlyAllowance
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
    
    // For K codes, we use a simple division as they reduce personal allowance
    const weeklyAllowance = annualAllowance / 52;
    const monthlyAllowance = weeklyAllowance * WEEKS_PER_MONTH;
    
    return { 
      code: taxCode, 
      allowance: annualAllowance,
      monthlyAllowance: Math.floor(monthlyAllowance * 100) / 100 // Round negative values down
    };
  }
  
  // Default to standard personal allowance if code not recognized
  return { 
    code: taxCode, 
    allowance: 12570, // Standard personal allowance for 2023-2024
    monthlyAllowance: calculateMonthlyFreePay("1257L") // Use HMRC formula for default
  };
}

/**
 * Calculates the monthly free pay (Month 1 basis) based on a UK tax code.
 * @param taxCode - The employee's tax code (e.g. "1257L", "326L")
 * @returns Monthly free pay in GBP
 */
export function calculateMonthlyFreePay(taxCode: string): number {
  const numericMatch = taxCode.match(/\d+/);
  if (!numericMatch) return 0;

  const numericPart = parseInt(numericMatch[0], 10);

  // HMRC formula: ((remainder * 10) + 9) / 12 + (quotient * (500 * 10 / 12))
  if (numericPart >= 500) {
    const quotient = Math.floor(numericPart / 500);
    const remainder = numericPart % 500;

    const annualRemainderValue = remainder * 10 + 9;
    const monthlyRemainder = annualRemainderValue / 12;

    const monthlyQuotient = quotient * (500 * 10 / 12);

    return parseFloat((monthlyRemainder + monthlyQuotient).toFixed(2));
  } else {
    // Less than 500 — simpler logic
    const annualValue = numericPart * 10 + 9;
    const monthlyValue = annualValue / 12;

    // Round up to nearest penny
    return Math.ceil(monthlyValue * 100) / 100;
  }
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
  // For Week1/Month1 basis (non-cumulative), only use current period's allowance
  if (!cumulative) {
    // Use the HMRC-compliant monthly free pay calculation
    return calculateMonthlyFreePay(taxCode.replace(' M1', ''));
  }
  
  // For cumulative basis, allowance is proportional to the number of periods
  // Use HMRC-compliant calculation then multiply by period
  const monthlyFreePay = calculateMonthlyFreePay(taxCode.replace(' M1', ''));
  return monthlyFreePay * period;
}

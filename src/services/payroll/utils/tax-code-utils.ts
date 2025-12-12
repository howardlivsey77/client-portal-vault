
/**
 * Utilities for handling UK tax codes
 */

export interface TaxCode {
  code: string;
  allowance: number;
  monthlyFreePay: number;
  breakdown?: {
    numericPart: number;
    quotient?: number;
    remainder?: number;
    annualValueOfRemainder?: number;
    monthlyValueOfRemainder?: number;
    freePayCode?: number;
    isOver500: boolean;
  };
}

/**
 * Calculate the monthly free pay from a tax code
 * @param taxCode The tax code to parse
 * @returns The monthly free pay amount
 */
export function calculateMonthlyFreePayFromTaxCode(taxCode: string): { 
  monthlyFreePay: number;
  breakdown: TaxCode['breakdown'];
} {
  // Standardize tax code and extract numeric part
  const cleanCode = taxCode.toUpperCase().trim();
  const numericMatch = cleanCode.match(/^(\d+)/);
  
  if (!numericMatch) {
    return { 
      monthlyFreePay: 0,
      breakdown: {
        numericPart: 0,
        isOver500: false
      }
    };
  }
  
  const numericPart = parseInt(numericMatch[1], 10);
  let monthlyFreePay = 0;
  let breakdown: TaxCode['breakdown'] = {
    numericPart,
    isOver500: numericPart >= 500
  };
  
  // Calculation for tax code with numeric part >= 500
  if (numericPart >= 500) {
    // Step 1: Divide by 500
    const quotient = Math.floor(numericPart / 500);
    const remainder = numericPart % 500;
    
    // Step 2: Calculate annual value of remainder
    const annualValueOfRemainder = (remainder * 10) + 9;
    
    // Step 3: Calculate monthly value of remainder - NOW ROUNDED UP to nearest penny
    const monthlyValueOfRemainder = Math.ceil((annualValueOfRemainder / 12) * 100) / 100;
    
    // Step 4: Calculate free pay code
    const freePayCode = quotient * ((500 * 10) / 12);
    
    // Step 5: Calculate total monthly free pay
    monthlyFreePay = monthlyValueOfRemainder + freePayCode;
    
    // Store breakdown for transparency
    breakdown = {
      numericPart,
      quotient,
      remainder,
      annualValueOfRemainder,
      monthlyValueOfRemainder,
      freePayCode,
      isOver500: true
    };
  } 
  // Calculation for tax code with numeric part < 500
  else {
    // Step 1: Calculate annual value
    const annualValue = (numericPart * 10) + 9;
    
    // Step 2: Calculate monthly value - NOW ROUNDED UP to nearest penny
    const monthlyValueOfRemainder = Math.ceil((annualValue / 12) * 100) / 100;
    monthlyFreePay = monthlyValueOfRemainder;
    
    // Store breakdown for transparency
    breakdown = {
      numericPart,
      annualValueOfRemainder: annualValue,
      monthlyValueOfRemainder,
      isOver500: false
    };
  }
  
  // Ensure the free pay is rounded to 2 decimal places
  return {
    monthlyFreePay: Math.ceil(monthlyFreePay * 100) / 100, // Round up to nearest penny
    breakdown
  };
}

/**
 * Parse a UK tax code to determine the tax-free allowance
 * Handles all HMRC tax code formats including:
 * - Standard codes: 1257L, 45L, 1L, 9999L (any number + L/M/N/T suffix)
 * - K codes: K497, K1, K9999 (negative allowance)
 * - Flat rate codes: BR (20%), D0 (40%), D1 (45%)
 * - No tax code: NT
 * - Emergency code: 0T
 */
export function parseTaxCode(taxCode: string): TaxCode {
  // Handle common tax code formats
  taxCode = taxCode.toUpperCase().trim();
  
  // Calculate the monthly free pay
  const freePayResult = calculateMonthlyFreePayFromTaxCode(taxCode);
  
  // BR code (basic rate 20% on all income)
  if (taxCode === 'BR') {
    return { 
      code: taxCode, 
      allowance: 0,
      monthlyFreePay: 0,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // D0 code (higher rate 40% on all income)
  if (taxCode === 'D0') {
    return { 
      code: taxCode, 
      allowance: 0,
      monthlyFreePay: 0,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // D1 code (additional rate 45% on all income)
  if (taxCode === 'D1') {
    return { 
      code: taxCode, 
      allowance: 0,
      monthlyFreePay: 0,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // NT code (no tax)
  if (taxCode === 'NT') {
    return { 
      code: taxCode, 
      allowance: Infinity,
      monthlyFreePay: Infinity,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // 0T code (emergency tax - no personal allowance)
  if (taxCode === '0T') {
    return { 
      code: taxCode, 
      allowance: 0,
      monthlyFreePay: 0,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // Standard codes with L, M, N, T suffixes (e.g., 1257L, 45L, 1L, 1257M, 1257T)
  // L = Standard, M = Marriage allowance recipient, N = Marriage allowance transferor, T = Other
  if (/^\d+[LMNT]$/.test(taxCode)) {
    const numberPart = parseInt(taxCode.replace(/[LMNT]$/, ''), 10);
    return { 
      code: taxCode, 
      allowance: numberPart * 10,
      monthlyFreePay: freePayResult.monthlyFreePay,
      breakdown: freePayResult.breakdown
    };
  }
  
  // K codes (reduce personal allowance - any numeric value)
  if (/^K\d+$/.test(taxCode)) {
    const numberPart = parseInt(taxCode.replace('K', ''), 10);
    // K codes work in reverse - they reduce free pay (add to taxable income)
    return { 
      code: taxCode, 
      allowance: -numberPart * 10,
      monthlyFreePay: -freePayResult.monthlyFreePay,
      breakdown: { ...freePayResult.breakdown, numericPart: numberPart }
    };
  }
  
  // Default to standard personal allowance if code not recognized
  return { 
    code: taxCode, 
    allowance: 12570, // Standard personal allowance for 2023-2024
    monthlyFreePay: 1047.50, // Monthly equivalent of £12,570 annual allowance
    breakdown: { numericPart: 1257, isOver500: true }
  };
}

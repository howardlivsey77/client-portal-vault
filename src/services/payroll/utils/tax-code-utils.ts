/**
 * Utilities for handling UK tax codes
 * Production-hardened with strict validation and error handling
 */

import { UnrecognizedTaxCodeError, UnsupportedTaxRegionError } from '../errors/payroll-errors';
import { TaxCodeSchema } from '../validation/payroll-validators';

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
 * 
 * Handles all HMRC tax code formats including:
 * - Standard codes: 1257L, 45L, 1L, 9999L (any number + L/M/N/T suffix)
 * - K codes: K497, K1, K9999 (negative allowance)
 * - Flat rate codes: BR (20%), D0 (40%), D1 (45%)
 * - No tax code: NT
 * - Emergency code: 0T
 * 
 * @throws UnrecognizedTaxCodeError if tax code format is not recognized
 * @throws UnsupportedTaxRegionError if Scottish (S) or Welsh (C) prefix detected
 */
export function parseTaxCode(taxCode: string): TaxCode {
  // Validate input format first
  const validatedCode = TaxCodeSchema.parse(taxCode);
  
  // Check for Scottish prefix (S1257L, SBR, etc.)
  if (validatedCode.startsWith('S')) {
    throw new UnsupportedTaxRegionError(validatedCode, 'Scotland');
  }
  
  // Check for Welsh prefix (C1257L, CBR, etc.)
  if (validatedCode.startsWith('C')) {
    throw new UnsupportedTaxRegionError(validatedCode, 'Wales');
  }
  
  // Calculate the monthly free pay for codes with numeric parts
  const freePayResult = calculateMonthlyFreePayFromTaxCode(validatedCode);
  
  // BR code (basic rate 20% on all income)
  if (validatedCode === 'BR') {
    return { 
      code: validatedCode, 
      allowance: 0,
      monthlyFreePay: 0,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // D0 code (higher rate 40% on all income)
  if (validatedCode === 'D0') {
    return { 
      code: validatedCode, 
      allowance: 0,
      monthlyFreePay: 0,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // D1 code (additional rate 45% on all income)
  if (validatedCode === 'D1') {
    return { 
      code: validatedCode, 
      allowance: 0,
      monthlyFreePay: 0,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // NT code (no tax)
  if (validatedCode === 'NT') {
    return { 
      code: validatedCode, 
      allowance: Infinity,
      monthlyFreePay: Infinity,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // 0T code (emergency tax - no personal allowance)
  if (validatedCode === '0T') {
    return { 
      code: validatedCode, 
      allowance: 0,
      monthlyFreePay: 0,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // Standard codes with L, M, N, T suffixes (e.g., 1257L, 45L, 1L, 1257M, 1257T)
  // L = Standard, M = Marriage allowance recipient, N = Marriage allowance transferor, T = Other
  if (/^\d+[LMNT]$/.test(validatedCode)) {
    const numberPart = parseInt(validatedCode.replace(/[LMNT]$/, ''), 10);
    return { 
      code: validatedCode, 
      allowance: numberPart * 10,
      monthlyFreePay: freePayResult.monthlyFreePay,
      breakdown: freePayResult.breakdown
    };
  }
  
  // K codes (reduce personal allowance - any numeric value)
  if (/^K\d+$/.test(validatedCode)) {
    const numberPart = parseInt(validatedCode.replace('K', ''), 10);
    // K codes work in reverse - they reduce free pay (add to taxable income)
    return { 
      code: validatedCode, 
      allowance: -numberPart * 10,
      monthlyFreePay: -freePayResult.monthlyFreePay,
      breakdown: { ...freePayResult.breakdown, numericPart: numberPart }
    };
  }
  
  // If we reach here, the tax code format is not recognized
  // CRITICAL: Do NOT fall back to defaults - throw error for manual review
  throw new UnrecognizedTaxCodeError(validatedCode);
}

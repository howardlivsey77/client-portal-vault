/**
 * Utilities for handling UK tax codes
 * Production-hardened with strict validation and error handling
 *
 * Supports English (no prefix), Scottish (S prefix), and Welsh (C prefix) tax codes.
 */

import { UnrecognizedTaxCodeError } from '../errors/payroll-errors';
import { TaxCodeSchema } from '../validation/payroll-validators';

export type TaxRegion = 'england_ni' | 'scotland' | 'wales';

export interface TaxCode {
  code: string;
  allowance: number;
  monthlyFreePay: number;
  taxRegion: TaxRegion;
  isKCode: boolean;
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
    isOver500: numericPart > 500
  };
  
  // Calculation for tax code with numeric part > 500
  // Per HMRC spec para 4.3.1: code 500 exactly uses the simple formula
  if (numericPart > 500) {
    // Step 1: Divide by 500
    const quotient = Math.floor(numericPart / 500);
    const remainder = numericPart % 500;
    
    // Step 2: Calculate annual value of remainder
    const annualValueOfRemainder = (remainder * 10) + 9;
    
    // Step 3: Calculate monthly value of remainder - rounded UP to nearest penny
    const monthlyValueOfRemainder = Math.ceil((annualValueOfRemainder / 12) * 100) / 100;
    
    // Step 4: Per HMRC spec para 4.3.1c iv: constant is 500×£10÷12 rounded UP = £416.67
    const MONTHLY_500_UNIT = 416.67;
    const freePayCode = quotient * MONTHLY_500_UNIT;
    
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
  // Calculation for tax code with numeric part <= 500
  else {
    // Step 1: Calculate annual value
    const annualValue = (numericPart * 10) + 9;
    
    // Step 2: Calculate monthly value - rounded UP to nearest penny
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
 * - Scottish prefix: S1257L, SBR, SD0, SD1, SD2
 * - Welsh prefix: C1257L, CBR, CD0, CD1
 * 
 * @throws UnrecognizedTaxCodeError if tax code format is not recognized
 */
export function parseTaxCode(taxCode: string): TaxCode {
  // Validate input format first
  const validatedCode = TaxCodeSchema.parse(taxCode);
  
  // Detect tax region and strip prefix
  let taxRegion: TaxRegion = 'england_ni';
  let coreCode = validatedCode;
  
  if (validatedCode.startsWith('S')) {
    // Check if it's a Scottish code (S prefix followed by a valid code pattern)
    const afterS = validatedCode.substring(1);
    if (afterS && (
      /^\d+[LMNT]$/.test(afterS) ||
      /^K\d+$/.test(afterS) ||
      ['BR', 'D0', 'D1', 'D2'].includes(afterS) ||
      afterS === 'NT' || afterS === '0T'
    )) {
      taxRegion = 'scotland';
      coreCode = afterS;
    }
    // If after stripping S it doesn't match known patterns, fall through to normal parsing
  } else if (validatedCode.startsWith('C')) {
    // Check if it's a Welsh code (C prefix followed by a valid code pattern)
    const afterC = validatedCode.substring(1);
    if (afterC && (
      /^\d+[LMNT]$/.test(afterC) ||
      /^K\d+$/.test(afterC) ||
      ['BR', 'D0', 'D1'].includes(afterC) ||
      afterC === 'NT' || afterC === '0T'
    )) {
      taxRegion = 'wales';
      coreCode = afterC;
    }
  }
  
  const zeroResult = (code: string): TaxCode => ({
    code: validatedCode,
    allowance: 0,
    monthlyFreePay: 0,
    taxRegion,
    isKCode: false,
    breakdown: { numericPart: 0, isOver500: false }
  });
  
  // Calculate the monthly free pay for codes with numeric parts
  const freePayResult = calculateMonthlyFreePayFromTaxCode(coreCode);
  
  // BR code (basic rate 20% on all income)
  if (coreCode === 'BR') {
    return zeroResult(coreCode);
  }
  
  // D0 code (higher rate 40% on all income)
  // For Scottish D0 = 42% (handled in cumulative-tax.ts, not here)
  if (coreCode === 'D0') {
    return zeroResult(coreCode);
  }
  
  // D1 code (additional rate 45% on all income)
  // For Scottish D1 = 45% (handled in cumulative-tax.ts)
  if (coreCode === 'D1') {
    return zeroResult(coreCode);
  }
  
  // SD2 (Scottish top rate 48%) — only valid with Scottish prefix
  if (coreCode === 'D2' && taxRegion === 'scotland') {
    return zeroResult(coreCode);
  }
  
  // NT code (no tax)
  if (coreCode === 'NT') {
    return { 
      code: validatedCode, 
      allowance: Infinity,
      monthlyFreePay: Infinity,
      taxRegion,
      isKCode: false,
      breakdown: { numericPart: 0, isOver500: false }
    };
  }
  
  // 0T code (emergency tax - no personal allowance)
  if (coreCode === '0T') {
    return { ...zeroResult(coreCode) };
  }
  
  // Standard codes with L, M, N, T suffixes (e.g., 1257L, 45L, 1L, 1257M, 1257T)
  if (/^\d+[LMNT]$/.test(coreCode)) {
    const numberPart = parseInt(coreCode.replace(/[LMNT]$/, ''), 10);
    return { 
      code: validatedCode, 
      allowance: numberPart * 10,
      monthlyFreePay: freePayResult.monthlyFreePay,
      taxRegion,
      isKCode: false,
      breakdown: freePayResult.breakdown
    };
  }
  
  // K codes (reduce personal allowance - any numeric value)
  if (/^K\d+$/.test(coreCode)) {
    const numberPart = parseInt(coreCode.replace('K', ''), 10);
    const kFreePayResult = calculateMonthlyFreePayFromTaxCode(numberPart.toString());
    return { 
      code: validatedCode, 
      allowance: -numberPart * 10,
      monthlyFreePay: -kFreePayResult.monthlyFreePay,
      taxRegion,
      isKCode: true,
      breakdown: { ...kFreePayResult.breakdown, numericPart: numberPart }
    };
  }
  
  // If we reach here, the tax code format is not recognized
  throw new UnrecognizedTaxCodeError(validatedCode);
}

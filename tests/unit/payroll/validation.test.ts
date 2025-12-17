import { describe, it, expect } from 'vitest';
import { calculateCumulativeTaxSync, calculateWeek1Month1Tax } from '@/services/payroll/calculations/cumulative-tax';
import { parseTaxCode } from '@/services/payroll/utils/tax-code-utils';
import { UnrecognizedTaxCodeError, UnsupportedTaxRegionError } from '@/services/payroll/errors/payroll-errors';
import { ZodError } from 'zod';

/**
 * Production Hardening Tests
 * Validates input validation, error handling, and edge cases
 * for tax calculation functions
 */

describe('Production Hardening - Input Validation', () => {
  describe('Tax code validation', () => {
    it('should throw UnrecognizedTaxCodeError for invalid tax codes', () => {
      expect(() => parseTaxCode('INVALID')).toThrow(UnrecognizedTaxCodeError);
      expect(() => parseTaxCode('XYZ123')).toThrow(UnrecognizedTaxCodeError);
      expect(() => parseTaxCode('12345')).toThrow(UnrecognizedTaxCodeError);
      expect(() => parseTaxCode('L')).toThrow(UnrecognizedTaxCodeError);
    });
    
    it('should throw UnsupportedTaxRegionError for Scottish tax codes', () => {
      expect(() => parseTaxCode('S1257L')).toThrow(UnsupportedTaxRegionError);
      expect(() => parseTaxCode('SBR')).toThrow(UnsupportedTaxRegionError);
      expect(() => parseTaxCode('SD0')).toThrow(UnsupportedTaxRegionError);
    });
    
    it('should throw UnsupportedTaxRegionError for Welsh tax codes', () => {
      expect(() => parseTaxCode('C1257L')).toThrow(UnsupportedTaxRegionError);
      expect(() => parseTaxCode('CBR')).toThrow(UnsupportedTaxRegionError);
    });
    
    it('should provide helpful error messages for unrecognized codes', () => {
      try {
        parseTaxCode('BANANA');
      } catch (e) {
        expect(e).toBeInstanceOf(UnrecognizedTaxCodeError);
        expect((e as UnrecognizedTaxCodeError).message).toContain('Valid formats');
        expect((e as UnrecognizedTaxCodeError).taxCode).toBe('BANANA');
      }
    });
    
    it('should throw ZodError for empty tax codes', () => {
      expect(() => parseTaxCode('')).toThrow(ZodError);
    });
    
    it('should throw ZodError for tax codes with special characters', () => {
      expect(() => parseTaxCode('1257L!')).toThrow(ZodError);
      expect(() => parseTaxCode('1257-L')).toThrow(ZodError);
    });
  });
  
  describe('Gross pay validation', () => {
    it('should throw ZodError for negative gross pay', () => {
      expect(() => calculateWeek1Month1Tax(-100, '1257L')).toThrow(ZodError);
      expect(() => calculateCumulativeTaxSync(1, -1000, '1257L', 0)).toThrow(ZodError);
    });
    
    it('should throw ZodError for NaN gross pay', () => {
      expect(() => calculateWeek1Month1Tax(NaN, '1257L')).toThrow(ZodError);
      expect(() => calculateCumulativeTaxSync(1, NaN, '1257L', 0)).toThrow(ZodError);
    });
    
    it('should throw ZodError for Infinity gross pay', () => {
      expect(() => calculateWeek1Month1Tax(Infinity, '1257L')).toThrow(ZodError);
      expect(() => calculateCumulativeTaxSync(1, Infinity, '1257L', 0)).toThrow(ZodError);
    });
    
    it('should throw ZodError for excessively large gross pay', () => {
      expect(() => calculateWeek1Month1Tax(100_000_000, '1257L')).toThrow(ZodError);
    });
  });
  
  describe('Period validation', () => {
    it('should throw ZodError for invalid periods', () => {
      expect(() => calculateCumulativeTaxSync(0, 1000, '1257L', 0)).toThrow(ZodError);
      expect(() => calculateCumulativeTaxSync(13, 1000, '1257L', 0)).toThrow(ZodError);
      expect(() => calculateCumulativeTaxSync(-1, 1000, '1257L', 0)).toThrow(ZodError);
    });
    
    it('should throw ZodError for non-integer periods', () => {
      expect(() => calculateCumulativeTaxSync(1.5, 1000, '1257L', 0)).toThrow(ZodError);
    });
  });
  
  describe('Tax paid YTD validation', () => {
    it('should throw ZodError for NaN tax paid YTD', () => {
      expect(() => calculateCumulativeTaxSync(1, 1000, '1257L', NaN)).toThrow(ZodError);
    });
    
    it('should allow negative tax paid YTD (for prior refunds)', () => {
      // Negative tax paid YTD is valid - could be from prior refunds
      const result = calculateCumulativeTaxSync(1, 2000, '1257L', -100);
      expect(result.taxThisPeriod).toBeGreaterThan(0);
    });
  });
});

describe('Production Hardening - Error Messages', () => {
  it('should include tax code in UnrecognizedTaxCodeError', () => {
    try {
      parseTaxCode('WEIRD');
    } catch (e) {
      expect((e as UnrecognizedTaxCodeError).taxCode).toBe('WEIRD');
    }
  });
  
  it('should include region in UnsupportedTaxRegionError', () => {
    try {
      parseTaxCode('S1257L');
    } catch (e) {
      expect((e as UnsupportedTaxRegionError).region).toBe('Scotland');
    }
    
    try {
      parseTaxCode('C1257L');
    } catch (e) {
      expect((e as UnsupportedTaxRegionError).region).toBe('Wales');
    }
  });
});

describe('Production Hardening - Valid Edge Cases', () => {
  it('should handle zero gross pay correctly', () => {
    const result = calculateWeek1Month1Tax(0, '1257L');
    expect(result.taxThisPeriod).toBe(0);
    expect(result.taxablePayThisPeriod).toBe(0);
  });
  
  it('should handle very small amounts correctly', () => {
    const result = calculateWeek1Month1Tax(0.01, '1257L');
    expect(result.taxThisPeriod).toBe(0);
  });
  
  it('should handle maximum valid gross pay', () => {
    // Just under the £10M limit
    const result = calculateWeek1Month1Tax(9_999_999, '1257L');
    expect(result.taxThisPeriod).toBeGreaterThan(0);
    expect(Number.isFinite(result.taxThisPeriod)).toBe(true);
  });
  
  it('should handle all valid periods 1-12', () => {
    for (let period = 1; period <= 12; period++) {
      const result = calculateCumulativeTaxSync(period, 2000 * period, '1257L', 0);
      expect(Number.isFinite(result.taxThisPeriod)).toBe(true);
    }
  });
});

describe('Production Hardening - Calculation Integrity', () => {
  it('should never return NaN for valid inputs', () => {
    const testCases = [
      { gross: 0, code: '1257L' },
      { gross: 1000, code: '1257L' },
      { gross: 50000, code: 'BR' },
      { gross: 100000, code: 'D0' },
      { gross: 1000000, code: 'D1' },
      { gross: 500, code: 'K497' },
      { gross: 5000, code: '0T' },
    ];
    
    for (const tc of testCases) {
      const result = calculateWeek1Month1Tax(tc.gross, tc.code);
      expect(Number.isNaN(result.taxThisPeriod)).toBe(false);
      expect(Number.isNaN(result.taxablePayThisPeriod)).toBe(false);
    }
  });
  
  it('should never return Infinity for valid inputs (except NT free pay)', () => {
    const result = calculateWeek1Month1Tax(100000, '1257L');
    expect(Number.isFinite(result.taxThisPeriod)).toBe(true);
    expect(Number.isFinite(result.taxablePayThisPeriod)).toBe(true);
    
    // NT is special - infinite free pay but finite tax (0)
    const ntResult = calculateWeek1Month1Tax(100000, 'NT');
    expect(ntResult.taxThisPeriod).toBe(0);
    expect(ntResult.freePayMonthly).toBe(Infinity);
  });
  
  it('should round tax to 2 decimal places', () => {
    const result = calculateWeek1Month1Tax(1234.567, '45L');
    const decimalPlaces = (result.taxThisPeriod.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});

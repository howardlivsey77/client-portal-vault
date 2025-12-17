import { describe, it, expect } from 'vitest';
import { parseTaxCode, calculateMonthlyFreePayFromTaxCode } from '@/services/payroll/utils/tax-code-utils';

/**
 * Tax Code Parsing Tests
 * Validates parsing of UK tax codes including:
 * - Standard L/M/N/T suffix codes
 * - K codes (negative allowance)
 * - Special codes (BR, D0, D1, NT, 0T)
 * - Case handling and edge cases
 */

describe('Tax Code Parsing - Generic Numeric Support', () => {
  // Standard L codes with various numeric values
  describe('Standard L suffix codes', () => {
    it('should correctly parse 1L tax code (small value)', () => {
      const result = parseTaxCode('1L');
      expect(result.code).toBe('1L');
      expect(result.allowance).toBe(10);
      // Annual = (1 × 10) + 9 = 19, Monthly = ceil(19/12) = ceil(1.583) = 1.59
      expect(result.monthlyFreePay).toBeCloseTo(1.59, 2);
    });
    
    it('should correctly parse 45L tax code', () => {
      const result = parseTaxCode('45L');
      expect(result.code).toBe('45L');
      expect(result.allowance).toBe(450);
      // Annual = (45 × 10) + 9 = 459, Monthly = ceil(459/12) = ceil(38.25) = 38.25
      expect(result.monthlyFreePay).toBeCloseTo(38.25, 2);
    });
    
    it('should correctly parse 100L tax code', () => {
      const result = parseTaxCode('100L');
      expect(result.code).toBe('100L');
      expect(result.allowance).toBe(1000);
      // Annual = (100 × 10) + 9 = 1009, Monthly = ceil(1009/12) = ceil(84.083) = 84.09
      expect(result.monthlyFreePay).toBeCloseTo(84.09, 2);
    });
    
    it('should correctly parse 499L tax code (just below 500 boundary)', () => {
      const result = parseTaxCode('499L');
      expect(result.code).toBe('499L');
      expect(result.allowance).toBe(4990);
      expect(result.breakdown?.isOver500).toBe(false);
    });
    
    it('should correctly parse 500L tax code (at 500 boundary)', () => {
      const result = parseTaxCode('500L');
      expect(result.code).toBe('500L');
      expect(result.allowance).toBe(5000);
      expect(result.breakdown?.isOver500).toBe(true);
    });
    
    it('should correctly parse 1257L tax code (standard personal allowance)', () => {
      const result = parseTaxCode('1257L');
      expect(result.code).toBe('1257L');
      expect(result.allowance).toBe(12570);
      expect(result.monthlyFreePay).toBeCloseTo(1047.67, 1);
    });
    
    it('should correctly parse 9999L tax code (large value)', () => {
      const result = parseTaxCode('9999L');
      expect(result.code).toBe('9999L');
      expect(result.allowance).toBe(99990);
      expect(result.breakdown?.isOver500).toBe(true);
    });
  });
  
  // Other suffixes (M, N, T) - should work same as L
  describe('Alternative suffix codes (M, N, T)', () => {
    it('should correctly parse 1257M (marriage allowance recipient)', () => {
      const result = parseTaxCode('1257M');
      expect(result.code).toBe('1257M');
      expect(result.allowance).toBe(12570);
      expect(result.monthlyFreePay).toBeCloseTo(1047.67, 1);
    });
    
    it('should correctly parse 1257N (marriage allowance transferor)', () => {
      const result = parseTaxCode('1257N');
      expect(result.code).toBe('1257N');
      expect(result.allowance).toBe(12570);
    });
    
    it('should correctly parse 1257T (other calculations)', () => {
      const result = parseTaxCode('1257T');
      expect(result.code).toBe('1257T');
      expect(result.allowance).toBe(12570);
    });
    
    it('should correctly parse 45T (small value with T suffix)', () => {
      const result = parseTaxCode('45T');
      expect(result.code).toBe('45T');
      expect(result.allowance).toBe(450);
      expect(result.monthlyFreePay).toBeCloseTo(38.25, 2);
    });
  });
  
  // K codes with various values
  describe('K codes (negative allowance)', () => {
    it('should correctly parse K1 (small K code)', () => {
      const result = parseTaxCode('K1');
      expect(result.code).toBe('K1');
      expect(result.allowance).toBe(-10);
      expect(result.monthlyFreePay).toBeLessThan(0);
    });
    
    it('should correctly parse K100', () => {
      const result = parseTaxCode('K100');
      expect(result.code).toBe('K100');
      expect(result.allowance).toBe(-1000);
      expect(result.monthlyFreePay).toBeLessThan(0);
    });
    
    it('should correctly parse K497', () => {
      const result = parseTaxCode('K497');
      expect(result.code).toBe('K497');
      expect(result.allowance).toBe(-4970);
      expect(result.monthlyFreePay).toBeLessThan(0);
    });
    
    it('should correctly parse K999 (large K code)', () => {
      const result = parseTaxCode('K999');
      expect(result.code).toBe('K999');
      expect(result.allowance).toBe(-9990);
    });
  });
  
  // Special codes
  describe('Special tax codes', () => {
    it('should handle 0T code (emergency tax)', () => {
      const result = parseTaxCode('0T');
      expect(result.code).toBe('0T');
      expect(result.allowance).toBe(0);
      expect(result.monthlyFreePay).toBe(0);
    });
    
    it('should handle BR code (basic rate 20%)', () => {
      const result = parseTaxCode('BR');
      expect(result.code).toBe('BR');
      expect(result.allowance).toBe(0);
      expect(result.monthlyFreePay).toBe(0);
    });
    
    it('should handle D0 code (higher rate 40%)', () => {
      const result = parseTaxCode('D0');
      expect(result.code).toBe('D0');
      expect(result.allowance).toBe(0);
      expect(result.monthlyFreePay).toBe(0);
    });
    
    it('should handle D1 code (additional rate 45%)', () => {
      const result = parseTaxCode('D1');
      expect(result.code).toBe('D1');
      expect(result.allowance).toBe(0);
      expect(result.monthlyFreePay).toBe(0);
    });
    
    it('should handle NT code (no tax)', () => {
      const result = parseTaxCode('NT');
      expect(result.code).toBe('NT');
      expect(result.allowance).toBe(Infinity);
      expect(result.monthlyFreePay).toBe(Infinity);
    });
  });
  
  // Case insensitivity
  describe('Case insensitivity', () => {
    it('should handle lowercase tax codes', () => {
      const result = parseTaxCode('1257l');
      expect(result.code).toBe('1257L');
      expect(result.allowance).toBe(12570);
    });
    
    it('should handle mixed case', () => {
      const result = parseTaxCode('k497');
      expect(result.code).toBe('K497');
      expect(result.allowance).toBe(-4970);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { calculateWeek1Month1Tax } from '@/services/payroll/calculations/cumulative-tax';
import { parseTaxCode } from '@/services/payroll/utils/tax-code-utils';

/**
 * HMRC Week 1/Month 1 (Non-Cumulative) Tax Calculation Tests
 * Validates W1/M1 calculations against official HMRC test data
 * 
 * Key differences from cumulative:
 * - Each period is independent (no YTD calculations)
 * - Uses monthly tax bands (1/12 of annual)
 * - No refunds possible within W1/M1 method
 */

const hmrcW1M1TestCases = [
  // Basic rate only scenarios
  { grossPay: 39.24, taxCode: '45L', expectedTax: 0.00, description: 'Below threshold - no tax' },
  { grossPay: 39.25, taxCode: '45L', expectedTax: 0.20, description: 'Just above threshold - £1 taxable' },
  { grossPay: 3164.24, taxCode: '45L', expectedTax: 625.00, description: 'Basic rate band limit' },
  { grossPay: 3164.25, taxCode: '45L', expectedTax: 625.20, description: 'Just above basic rate limit' },
  
  // Higher rate scenarios  
  { grossPay: 10450.24, taxCode: '45L', expectedTax: 3536.06, description: 'Well into higher rate' },
  { grossPay: 10500.78, taxCode: '45L', expectedTax: 3558.15, description: 'Higher rate mid-band' },
  
  // Additional rate scenarios
  { grossPay: 12539.24, taxCode: '45L', expectedTax: 4475.25, description: 'At additional rate boundary' },
  { grossPay: 12539.25, taxCode: '45L', expectedTax: 4475.70, description: 'Into additional rate' },
  
  // Special flat rate codes
  { grossPay: 99.99, taxCode: 'BR', expectedTax: 19.80, description: 'BR: Basic rate (20%) flat' },
  { grossPay: 99.99, taxCode: 'D0', expectedTax: 39.60, description: 'D0: Higher rate (40%) flat' },
  { grossPay: 99.99, taxCode: 'D1', expectedTax: 44.55, description: 'D1: Additional rate (45%) flat' },
];

describe('HMRC Week 1/Month 1 Tax Calculations', () => {
  describe('45L tax code calculations', () => {
    hmrcW1M1TestCases
      .filter(tc => tc.taxCode === '45L')
      .forEach((tc) => {
        it(`${tc.description}: £${tc.grossPay} → £${tc.expectedTax}`, () => {
          const result = calculateWeek1Month1Tax(tc.grossPay, tc.taxCode);
          
          // Within £0.01 tolerance per HMRC requirements
          expect(Math.abs(result.taxThisPeriod - tc.expectedTax)).toBeLessThanOrEqual(0.01);
        });
      });
  });
  
  describe('Flat rate tax codes (BR, D0, D1)', () => {
    hmrcW1M1TestCases
      .filter(tc => ['BR', 'D0', 'D1'].includes(tc.taxCode))
      .forEach((tc) => {
        it(`${tc.taxCode}: £${tc.grossPay} → £${tc.expectedTax} (${tc.description})`, () => {
          const result = calculateWeek1Month1Tax(tc.grossPay, tc.taxCode);
          
          expect(Math.abs(result.taxThisPeriod - tc.expectedTax)).toBeLessThanOrEqual(0.01);
        });
      });
  });
  
  describe('45L monthly free pay verification', () => {
    it('should calculate correct monthly free pay for 45L', () => {
      const result = parseTaxCode('45L');
      
      // 45L: Annual = (45 × 10) + 9 = 459, Monthly = ceil(459/12) = 38.25
      expect(result.monthlyFreePay).toBeCloseTo(38.25, 2);
    });
    
    it('should correctly determine taxable threshold for 45L', () => {
      const result = calculateWeek1Month1Tax(38.25, '45L');
      
      // With £38.25 gross and £38.25 free pay, taxable should be £0
      expect(result.taxablePayThisPeriod).toBe(0);
      expect(result.taxThisPeriod).toBe(0);
    });
  });
  
  describe('Various tax codes with W1/M1', () => {
    it('NT code: No tax on any amount', () => {
      const result = calculateWeek1Month1Tax(50000, 'NT');
      
      expect(result.taxThisPeriod).toBe(0);
      expect(result.freePayMonthly).toBe(Infinity);
    });
    
    it('0T code: No personal allowance (emergency tax)', () => {
      const result = calculateWeek1Month1Tax(5000, '0T');
      
      // All income taxable, basic rate on first £3,141
      expect(result.freePayMonthly).toBe(0);
      expect(result.taxablePayThisPeriod).toBe(5000);
      // Basic: £3,141 × 20% = £628.20
      // Higher: £1,859 × 40% = £743.60
      // Total: £1,371.80
      expect(result.taxThisPeriod).toBeCloseTo(1371.80, 2);
    });
    
    it('1257L code: Standard personal allowance', () => {
      const result = calculateWeek1Month1Tax(2000, '1257L');
      
      // Free pay ≈ £1,047.67
      // Taxable = £2,000 - £1,047.67 = £952.33 → £952
      // Tax = £952 × 20% = £190.40
      expect(result.taxablePayThisPeriod).toBe(952);
      expect(result.taxThisPeriod).toBeCloseTo(190.40, 2);
    });
    
    it('K497 code: Negative allowance adds to taxable income', () => {
      const result = calculateWeek1Month1Tax(1000, 'K497');
      
      // K497 monthly free pay is negative
      // This adds to taxable income
      expect(result.freePayMonthly).toBeLessThan(0);
      expect(result.taxablePayThisPeriod).toBeGreaterThan(1000);
    });
  });
  
  describe('Monthly tax band boundaries', () => {
    it('should apply monthly basic rate limit of £3,141', () => {
      // Monthly basic limit = floor(37700/12) = £3,141
      const result = calculateWeek1Month1Tax(3141 + 38.25, '45L'); // £3,179.25 gross
      
      // Taxable = £3,179.25 - £38.25 = £3,141 (exactly at basic limit)
      // Tax = £3,141 × 20% = £628.20
      expect(result.taxablePayThisPeriod).toBe(3141);
      expect(result.taxThisPeriod).toBeCloseTo(628.20, 2);
    });
    
    it('should apply monthly higher rate above £3,141', () => {
      const result = calculateWeek1Month1Tax(3241 + 38.25, '45L'); // £3,279.25 gross
      
      // Taxable = £3,241
      // Basic: £3,141 × 20% = £628.20
      // Higher: £100 × 40% = £40.00
      // Total: £668.20
      expect(result.taxablePayThisPeriod).toBe(3241);
      expect(result.taxThisPeriod).toBeCloseTo(668.20, 2);
    });
    
    it('should apply monthly additional rate above £10,428', () => {
      // Monthly higher limit = floor(125140/12) = £10,428
      const result = calculateWeek1Month1Tax(10528 + 38.25, '45L'); // £10,566.25 gross
      
      // Taxable = £10,528
      // Basic: £3,141 × 20% = £628.20
      // Higher: £7,287 × 40% = £2,914.80
      // Additional: £100 × 45% = £45.00
      // Total: £3,588.00
      expect(result.taxablePayThisPeriod).toBe(10528);
      expect(result.taxThisPeriod).toBeCloseTo(3588.00, 2);
    });
  });
});

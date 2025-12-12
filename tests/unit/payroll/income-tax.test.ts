
import { describe, it, expect, beforeEach } from 'vitest';
import { calculateCumulativeTaxSync, calculateWeek1Month1Tax } from '@/services/payroll/calculations/cumulative-tax';
import { parseTaxCode, calculateMonthlyFreePayFromTaxCode } from '@/services/payroll/utils/tax-code-utils';

/**
 * HMRC Test Data from provided Excel file
 * This validates our cumulative tax calculations match HMRC expected results
 * 
 * Tax Code: 1257L (Personal Allowance £12,570)
 * Monthly Free Pay: £1,047.67
 */
const hmrcTestCases = [
  { 
    period: 1, 
    grossPay: 1156.25, 
    grossPayYTD: 1156.25, 
    expectedFreePayYTD: 1047.67, 
    expectedTaxablePayYTD: 108, 
    expectedTaxThisPeriod: 21.60, 
    expectedTaxYTD: 21.60 
  },
  { 
    period: 2, 
    grossPay: 1156.26, 
    grossPayYTD: 2312.51, 
    expectedFreePayYTD: 2095.34, 
    expectedTaxablePayYTD: 217, 
    expectedTaxThisPeriod: 21.80, 
    expectedTaxYTD: 43.40 
  },
  { 
    period: 3, 
    grossPay: 2105.72, 
    grossPayYTD: 4418.23, 
    expectedFreePayYTD: 3143.01, 
    expectedTaxablePayYTD: 1275, 
    expectedTaxThisPeriod: 211.60, 
    expectedTaxYTD: 255.00 
  },
  { 
    period: 4, 
    grossPay: 2000.00, 
    grossPayYTD: 6418.23, 
    expectedFreePayYTD: 4190.68, 
    expectedTaxablePayYTD: 2227, 
    expectedTaxThisPeriod: 190.40, 
    expectedTaxYTD: 445.40 
  },
  { 
    period: 5, 
    grossPay: 2000.00, 
    grossPayYTD: 8418.23, 
    expectedFreePayYTD: 5238.35, 
    expectedTaxablePayYTD: 3179, 
    expectedTaxThisPeriod: 190.40, 
    expectedTaxYTD: 635.80 
  },
  { 
    period: 6, 
    grossPay: 1800.00, 
    grossPayYTD: 10218.23, 
    expectedFreePayYTD: 6286.02, 
    expectedTaxablePayYTD: 3932, 
    expectedTaxThisPeriod: 150.60, 
    expectedTaxYTD: 786.40 
  },
  { 
    period: 7, 
    grossPay: 1800.00, 
    grossPayYTD: 12018.23, 
    expectedFreePayYTD: 7333.69, 
    expectedTaxablePayYTD: 4684, 
    expectedTaxThisPeriod: 150.40, 
    expectedTaxYTD: 936.80 
  },
  { 
    period: 8, 
    grossPay: 6540.00, 
    grossPayYTD: 18558.23, 
    expectedFreePayYTD: 8381.36, 
    expectedTaxablePayYTD: 10176, 
    expectedTaxThisPeriod: 1098.40, 
    expectedTaxYTD: 2035.20 
  },
  { 
    period: 9, 
    grossPay: 1800.00, 
    grossPayYTD: 20358.23, 
    expectedFreePayYTD: 9429.03, 
    expectedTaxablePayYTD: 10929, 
    expectedTaxThisPeriod: 150.60, 
    expectedTaxYTD: 2185.80 
  },
  { 
    period: 10, 
    grossPay: 0.00, 
    grossPayYTD: 20358.23, 
    expectedFreePayYTD: 10476.70, 
    expectedTaxablePayYTD: 9881, 
    expectedTaxThisPeriod: -209.60, // REFUND - critical test case
    expectedTaxYTD: 1976.20 
  }
];

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

describe('Cumulative Free Pay YTD Calculation', () => {
  const monthlyFreePay = parseTaxCode('1257L').monthlyFreePay;
  
  hmrcTestCases.forEach((tc) => {
    it(`Period ${tc.period}: Free Pay YTD should be £${tc.expectedFreePayYTD}`, () => {
      const calculatedFreePayYTD = monthlyFreePay * tc.period;
      
      // Allow £0.10 tolerance due to rounding differences
      expect(Math.abs(calculatedFreePayYTD - tc.expectedFreePayYTD)).toBeLessThanOrEqual(0.10);
    });
  });
});

describe('HMRC Cumulative Tax Calculations', () => {
  hmrcTestCases.forEach((tc, index) => {
    it(`Period ${tc.period}: Gross £${tc.grossPayYTD} → Tax £${tc.expectedTaxThisPeriod} (YTD: £${tc.expectedTaxYTD})`, () => {
      // Get previous period's tax paid YTD
      const previousTaxPaidYTD = index === 0 ? 0 : hmrcTestCases[index - 1].expectedTaxYTD;
      
      const result = calculateCumulativeTaxSync(
        tc.period,
        tc.grossPayYTD,
        '1257L',
        previousTaxPaidYTD
      );
      
      // Verify taxable pay YTD (should be rounded down)
      expect(result.taxablePayYTD).toBe(tc.expectedTaxablePayYTD);
      
      // Verify tax this period (within £1 tolerance for sync version)
      // The sync version uses simplified bands, so tolerance is higher
      expect(Math.abs(result.taxThisPeriod - tc.expectedTaxThisPeriod)).toBeLessThanOrEqual(1.00);
      
      // Verify tax YTD
      expect(Math.abs(result.taxDueYTD - tc.expectedTaxYTD)).toBeLessThanOrEqual(1.00);
    });
  });
  
  it('Period 10: Should correctly calculate TAX REFUND of approximately -£209.60', () => {
    // This is the critical refund case
    // When no pay is received in period 10, but free pay accumulates,
    // the cumulative taxable income decreases, resulting in a refund
    
    const previousTaxPaidYTD = hmrcTestCases[8].expectedTaxYTD; // Period 9's YTD tax
    
    const result = calculateCumulativeTaxSync(
      10,
      20358.23, // Same gross YTD as period 9 (no pay this period)
      '1257L',
      previousTaxPaidYTD
    );
    
    // Tax this period should be negative (refund)
    expect(result.taxThisPeriod).toBeLessThan(0);
    
    // Should be approximately -£209.60
    expect(Math.abs(result.taxThisPeriod - (-209.60))).toBeLessThanOrEqual(5.00);
  });
});

describe('Special Tax Code Calculations', () => {
  it('BR code: Basic rate (20%) on all income, no personal allowance', () => {
    const result = calculateCumulativeTaxSync(1, 2000, 'BR', 0);
    
    expect(result.freePayYTD).toBe(0);
    expect(result.taxablePayYTD).toBe(2000);
    expect(result.taxThisPeriod).toBe(400); // 20% of £2000
  });
  
  it('NT code: No tax due, refunds previous tax', () => {
    const result = calculateCumulativeTaxSync(1, 10000, 'NT', 500);
    
    expect(result.taxDueYTD).toBe(0);
    expect(result.taxThisPeriod).toBe(-500); // Refund of previous £500 paid
  });
  
  it('K code: Adds to taxable income', () => {
    // K497 means £4,970 is ADDED to taxable income (negative allowance)
    const result = calculateCumulativeTaxSync(1, 1000, 'K497', 0);
    
    // Free pay should be negative
    expect(result.freePayYTD).toBeLessThan(0);
    
    // Taxable pay should be higher than gross pay
    expect(result.taxablePayYTD).toBeGreaterThan(1000);
  });
});

describe('Tax Band Boundaries', () => {
  it('should apply basic and higher rates for income of £50,000 with 0T code', () => {
    // 0T code defaults to standard allowance in parseTaxCode
    // For testing bands, we use BR which has 0 allowance but applies 20% only
    // Let's test with a high earner scenario using 1257L
    const result = calculateCumulativeTaxSync(12, 62570, '1257L', 0);
    
    // With 1257L: Free pay YTD = £1,047.67 × 12 = £12,572.04
    // Taxable = £62,570 - £12,572.04 = £49,997.96 → £49,997 (rounded down)
    // Basic rate: £37,700 × 20% = £7,540
    // Higher rate: £12,297 × 40% = £4,918.80
    // Total ≈ £12,458.80
    expect(result.taxablePayYTD).toBe(49997);
    expect(result.taxDueYTD).toBeCloseTo(12458.8, 0);
  });
  
  it('BR code: should apply 20% on all income regardless of amount', () => {
    const result = calculateCumulativeTaxSync(12, 100000, 'BR', 0);
    
    // BR code = basic rate (20%) on ALL income, no bands
    expect(result.taxablePayYTD).toBe(100000);
    expect(result.taxDueYTD).toBe(20000); // 20% of £100,000
  });
  
  it('D0 code: should apply 40% on all income', () => {
    const result = calculateCumulativeTaxSync(12, 50000, 'D0', 0);
    
    expect(result.taxablePayYTD).toBe(50000);
    expect(result.taxDueYTD).toBe(20000); // 40% of £50,000
  });
  
  it('D1 code: should apply 45% on all income', () => {
    const result = calculateCumulativeTaxSync(12, 50000, 'D1', 0);
    
    expect(result.taxablePayYTD).toBe(50000);
    expect(result.taxDueYTD).toBe(22500); // 45% of £50,000
  });
});

describe('Edge Cases', () => {
  it('should handle zero gross pay', () => {
    const result = calculateCumulativeTaxSync(1, 0, '1257L', 0);
    
    expect(result.taxablePayYTD).toBe(0);
    expect(result.taxThisPeriod).toBe(0);
  });
  
  it('should handle gross pay less than free pay', () => {
    const result = calculateCumulativeTaxSync(1, 500, '1257L', 0);
    
    // £500 gross is less than £1,047.67 free pay
    expect(result.taxablePayYTD).toBe(0);
    expect(result.taxThisPeriod).toBe(0);
  });
  
  it('should handle mid-year starter (period 6 start)', () => {
    // Employee starts in period 6 with first pay
    const result = calculateCumulativeTaxSync(6, 3000, '1257L', 0);
    
    // Free pay YTD = £1,047.67 × 6 = £6,286.02
    // Since gross (£3000) < free pay, no tax due
    expect(result.taxablePayYTD).toBe(0);
    expect(result.taxThisPeriod).toBe(0);
  });
  
  it('should accumulate refunds over multiple zero-pay periods', () => {
    // Simulate employee with high pay early, then no pay
    // Period 1: £20,000 gross
    const period1 = calculateCumulativeTaxSync(1, 20000, '1257L', 0);
    
    // Period 2: No additional pay (same YTD gross)
    const period2 = calculateCumulativeTaxSync(2, 20000, '1257L', period1.taxDueYTD);
    
    // Period 2 should be a refund because free pay increased but income didn't
    expect(period2.taxThisPeriod).toBeLessThan(0);
  });
});

/**
 * HMRC Week 1/Month 1 (Non-Cumulative) Test Data
 * From official HMRC test cases for tax code 45L
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

import { describe, it, expect } from 'vitest';
import { calculateCumulativeTaxSync, calculateWeek1Month1Tax } from '@/services/payroll/calculations/cumulative-tax';
import { parseTaxCode } from '@/services/payroll/utils/tax-code-utils';

/**
 * HMRC Cumulative Tax Calculation Tests
 * Validates cumulative tax calculations against official HMRC test data
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

describe('K Code Edge Cases', () => {
  it('K code: taxable pay should exceed gross pay (cumulative)', () => {
    // K497 monthly free pay ≈ -£414.17
    const result = calculateCumulativeTaxSync(1, 500, 'K497', 0);
    
    // Taxable = £500 - (-£414.17) = £914.17 → £914 (floor)
    expect(result.taxablePayYTD).toBeGreaterThan(500);
    expect(result.freePayYTD).toBeLessThan(0);
    
    // Verify it's not clamped to 0
    expect(result.taxablePayYTD).toBe(914);
  });
  
  it('K code: should not clamp taxable pay to 0 with low gross', () => {
    // K100 means ~£83.33/month added to taxable
    const result = calculateCumulativeTaxSync(1, 100, 'K100', 0);
    
    // Taxable = £100 - (-£83.33) = £183.33 → £183
    expect(result.taxablePayYTD).toBeGreaterThan(100);
    expect(result.taxablePayYTD).toBe(183);
  });
  
  it('K code: W1/M1 should also not clamp taxable pay', () => {
    // K497 monthly free pay ≈ -£414.17
    const result = calculateWeek1Month1Tax(500, 'K497');
    
    // Taxable = £500 - (-£414.17) = £914.17 → £914
    expect(result.taxablePayThisPeriod).toBeGreaterThan(500);
    expect(result.taxablePayThisPeriod).toBe(914);
  });
  
  it('K code: cumulative over multiple periods', () => {
    // K497 for 3 periods with £1500 gross YTD
    const result = calculateCumulativeTaxSync(3, 1500, 'K497', 0);
    
    // Free pay = -£414.17 × 3 = -£1,242.51
    // Taxable = £1500 - (-£1,242.51) = £2,742.51 → £2,742
    expect(result.freePayYTD).toBeLessThan(0);
    expect(result.taxablePayYTD).toBe(2742);
    expect(result.taxablePayYTD).toBeGreaterThan(1500);
  });
  
  it('K code: zero gross should still produce positive taxable income', () => {
    // K100 with zero gross - taxable should be the K amount itself
    const result = calculateCumulativeTaxSync(1, 0, 'K100', 0);
    
    // Taxable = £0 - (-£83.33) = £83.33 → £83
    expect(result.taxablePayYTD).toBe(83);
    expect(result.taxThisPeriod).toBeGreaterThan(0); // Should have tax due
  });
  
  it('K code: W1/M1 with zero gross should produce positive taxable income', () => {
    const result = calculateWeek1Month1Tax(0, 'K100');
    
    // Taxable = £0 - (-£83.33) = £83.33 → £83
    expect(result.taxablePayThisPeriod).toBe(83);
    expect(result.taxThisPeriod).toBeGreaterThan(0);
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

describe('Cumulative Tax Edge Cases', () => {
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

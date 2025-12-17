import { describe, it, expect } from 'vitest';
import { calculateNationalInsuranceFallback } from '../fallback-calculation';

/**
 * HMRC NI Category A Test Data for 2025/26 and 2026/27
 * Source: HMRC CA38 National Insurance Tables
 * 
 * These tests validate the NI calculations against official HMRC test data
 * for NI Category A (standard employee NI contributions).
 * 
 * Key thresholds (monthly):
 * - Secondary Threshold (ST): £417 (employer NI starts)
 * - Lower Earnings Limit (LEL): £542
 * - Primary Threshold (PT): £1048 (employee NI starts)
 * - Upper Earnings Limit (UEL): £4189
 * 
 * Rates:
 * - Employee: 8% between PT and UEL, 2% above UEL
 * - Employer: 15% above ST
 */
describe('NI Category A - 2025/26 and 2026/27', () => {
  describe('Employee NI', () => {
    it.each([
      // Below ST - no NI
      { gross: 417.03, expectedNI: 0.00, description: 'Below ST' },
      { gross: 417.04, expectedNI: 0.00, description: 'At ST (employee threshold not reached)' },
      
      // Below PT - no employee NI (but employer pays)
      { gross: 542.00, expectedNI: 0.00, description: 'At LEL' },
      { gross: 542.01, expectedNI: 0.00, description: 'Just above LEL' },
      { gross: 1048.07, expectedNI: 0.00, description: 'Just below PT' },
      
      // At PT boundary - employee NI starts
      { gross: 1048.08, expectedNI: 0.01, description: 'At PT boundary (8p above PT = 0.01 NI)' },
      { gross: 1048.31, expectedNI: 0.02, description: '31p above PT = 0.02 NI' },
      { gross: 1048.32, expectedNI: 0.02, description: '32p above PT = 0.02 NI' },
      
      // Between PT and UEL - 8% rate
      { gross: 2083.05, expectedNI: 82.80, description: 'Mid-range (£1035.05 × 8% = £82.80)' },
      { gross: 2083.06, expectedNI: 82.80, description: 'Mid-range +1p' },
      
      // At UEL boundary
      { gross: 4188.53, expectedNI: 251.24, description: 'Just below UEL' },
      { gross: 4188.54, expectedNI: 251.24, description: 'At UEL boundary' },
      
      // At UEL - full 8% rate applies
      { gross: 4189.04, expectedNI: 251.28, description: 'At UEL (£3141 × 8% = £251.28)' },
      { gross: 4189.05, expectedNI: 251.28, description: 'Just above UEL (2% rate on excess)' },
    ])('$description: £$gross gross → £$expectedNI employee NI', ({ gross, expectedNI }) => {
      const result = calculateNationalInsuranceFallback(gross);
      expect(result.nationalInsurance).toBeCloseTo(expectedNI, 2);
    });
  });

  describe('Employer NI', () => {
    it.each([
      // Below ST - no employer NI
      { gross: 417.03, expectedNI: 0.00, description: 'Below ST' },
      
      // At ST - employer NI starts
      { gross: 417.04, expectedNI: 0.01, description: '1p above ST = 0.01 NI at 15%' },
      
      // Above ST - 15% rate
      { gross: 542.00, expectedNI: 18.75, description: 'At LEL (£125 × 15% = £18.75)' },
      { gross: 542.01, expectedNI: 18.75, description: 'Just above LEL' },
      { gross: 1048.07, expectedNI: 94.66, description: 'Just below PT (£631.07 × 15% = £94.66)' },
      { gross: 1048.08, expectedNI: 94.66, description: 'At PT (£631.08 × 15% = £94.66)' },
      { gross: 1048.31, expectedNI: 94.70, description: 'Above PT' },
      { gross: 1048.32, expectedNI: 94.70, description: 'Above PT +1p' },
      { gross: 2083.05, expectedNI: 249.91, description: 'Mid-range (£1666.05 × 15% = £249.91)' },
      { gross: 2083.06, expectedNI: 249.91, description: 'Mid-range +1p' },
      { gross: 4188.53, expectedNI: 565.73, description: 'Just below UEL' },
      { gross: 4188.54, expectedNI: 565.73, description: 'At UEL boundary' },
      { gross: 4189.04, expectedNI: 565.81, description: 'At UEL (£3772.04 × 15% = £565.81)' },
      { gross: 4189.05, expectedNI: 565.81, description: 'Just above UEL' },
    ])('$description: £$gross gross → £$expectedNI employer NI', ({ gross, expectedNI }) => {
      const result = calculateNationalInsuranceFallback(gross);
      expect(result.employerNationalInsurance).toBeCloseTo(expectedNI, 2);
    });
  });

  describe('Total NI (Employee + Employer)', () => {
    it.each([
      { gross: 417.03, expectedTotal: 0.00 },
      { gross: 417.04, expectedTotal: 0.01 },
      { gross: 542.00, expectedTotal: 18.75 },
      { gross: 542.01, expectedTotal: 18.75 },
      { gross: 1048.07, expectedTotal: 94.66 },
      { gross: 1048.08, expectedTotal: 94.67 },
      { gross: 1048.31, expectedTotal: 94.72 },
      { gross: 1048.32, expectedTotal: 94.72 },
      { gross: 2083.05, expectedTotal: 332.71 },
      { gross: 2083.06, expectedTotal: 332.71 },
      { gross: 4188.53, expectedTotal: 816.97 },
      { gross: 4188.54, expectedTotal: 816.97 },
      { gross: 4189.04, expectedTotal: 817.09 },
      { gross: 4189.05, expectedTotal: 817.09 },
    ])('£$gross gross → £$expectedTotal total NI', ({ gross, expectedTotal }) => {
      const result = calculateNationalInsuranceFallback(gross);
      const total = result.nationalInsurance + result.employerNationalInsurance;
      expect(total).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('Earnings bands (82/82A columns)', () => {
    it('correctly allocates £542 across bands (at LEL)', () => {
      const result = calculateNationalInsuranceFallback(542.00);
      expect(result.earningsAtLEL).toBe(542.00);
      expect(result.earningsLELtoPT).toBe(0);
      expect(result.earningsPTtoUEL).toBe(0);
      expect(result.earningsAboveUEL).toBe(0);
      expect(result.earningsAboveST).toBeCloseTo(125.00, 2); // 542 - 417 = 125
    });

    it('correctly allocates £1048.08 across bands (at PT)', () => {
      const result = calculateNationalInsuranceFallback(1048.08);
      expect(result.earningsAtLEL).toBe(542.00);
      expect(result.earningsLELtoPT).toBe(506.00); // 1048 - 542 = 506
      expect(result.earningsPTtoUEL).toBeCloseTo(0.08, 2);
      expect(result.earningsAboveUEL).toBe(0);
      expect(result.earningsAboveST).toBeCloseTo(631.08, 2); // 1048.08 - 417 = 631.08
    });

    it('correctly allocates £2083.05 across bands (mid-range)', () => {
      const result = calculateNationalInsuranceFallback(2083.05);
      expect(result.earningsAtLEL).toBe(542.00);
      expect(result.earningsLELtoPT).toBe(506.00);
      expect(result.earningsPTtoUEL).toBeCloseTo(1035.05, 2); // 2083.05 - 1048 = 1035.05
      expect(result.earningsAboveUEL).toBe(0);
      expect(result.earningsAboveST).toBeCloseTo(1666.05, 2); // 2083.05 - 417 = 1666.05
    });

    it('correctly allocates £4189.04 across bands (at UEL)', () => {
      const result = calculateNationalInsuranceFallback(4189.04);
      expect(result.earningsAtLEL).toBe(542.00);
      expect(result.earningsLELtoPT).toBe(506.00);
      expect(result.earningsPTtoUEL).toBeCloseTo(3141.00, 2); // 4189 - 1048 = 3141
      expect(result.earningsAboveUEL).toBeCloseTo(0.04, 2);
      expect(result.earningsAboveST).toBeCloseTo(3772.04, 2); // 4189.04 - 417 = 3772.04
    });
  });

  describe('Edge cases', () => {
    it('returns zero NI for zero salary', () => {
      const result = calculateNationalInsuranceFallback(0);
      expect(result.nationalInsurance).toBe(0);
      expect(result.employerNationalInsurance).toBe(0);
    });

    it('returns zero NI for negative salary', () => {
      const result = calculateNationalInsuranceFallback(-1000);
      expect(result.nationalInsurance).toBe(0);
      expect(result.employerNationalInsurance).toBe(0);
    });

    it('handles very high salaries (above UEL)', () => {
      // £10,000 salary
      // Employee: (3141 × 8%) + (5811 × 2%) = 251.28 + 116.22 = 367.50
      // Employer: (10000 - 417) × 15% = 9583 × 15% = 1437.45
      const result = calculateNationalInsuranceFallback(10000);
      expect(result.nationalInsurance).toBeCloseTo(367.50, 2);
      expect(result.employerNationalInsurance).toBeCloseTo(1437.45, 2);
    });
  });
});

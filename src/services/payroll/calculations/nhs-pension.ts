/**
 * NHS Pension Calculator
 * 
 * Calculates NHS pension contributions based on tiered contribution rates.
 * 
 * REGULATORY BASIS:
 * NHS Pension Scheme member contribution rates are based on whole-time
 * equivalent pensionable pay and determined by NHS Employers.
 * 
 * References:
 * - NHS Employers: https://www.nhsemployers.org/articles/contribution-rates
 * - NHS Pensions: https://www.nhsbsa.nhs.uk/nhs-pensions
 * 
 * Tier determination uses previous year's pensionable pay where available,
 * otherwise current annual salary (monthly × 12).
 */

import { supabase } from "@/integrations/supabase/client";
import { payrollLogger } from "../utils/payrollLogger";

interface NHSPensionBand {
  tier_number: number;
  annual_pensionable_pay_from: number;
  annual_pensionable_pay_to: number | null;
  employee_contribution_rate: number;
  employer_contribution_rate: number;
}

interface NHSPensionResult {
  employeeContribution: number;
  employerContribution: number;
  tier: number;
  employeeRate: number;
  employerRate: number;
}

/**
 * Fetch NHS pension bands for a given tax year
 */
async function getNHSPensionBands(taxYear: string): Promise<NHSPensionBand[]> {
  try {
    const { data, error } = await supabase
      .from('nhs_pension_bands')
      .select('*')
      .eq('tax_year', taxYear)
      .eq('is_current', true)
      .order('tier_number');

    if (error) {
      payrollLogger.error('Error fetching NHS pension bands', error, 'PENSION');
      return [];
    }

    return data || [];
  } catch (error) {
    payrollLogger.error('Error in getNHSPensionBands', error, 'PENSION');
    return [];
  }
}

/**
 * Determine NHS pension tier based on annual pensionable pay
 */
function determineNHSPensionTier(annualPensionablePay: number, bands: NHSPensionBand[]): NHSPensionBand | null {
  // Convert annual pay to pennies for comparison
  const annualPayPennies = Math.round(annualPensionablePay * 100);
  
  for (const band of bands) {
    const fromPennies = band.annual_pensionable_pay_from;
    const toPennies = band.annual_pensionable_pay_to;
    
    if (toPennies === null) {
      // This is the highest tier (no upper limit)
      if (annualPayPennies >= fromPennies) {
        return band;
      }
    } else {
      // Normal tier with upper and lower bounds
      if (annualPayPennies >= fromPennies && annualPayPennies < toPennies) {
        return band;
      }
    }
  }
  
  return null;
}

/**
 * Calculate NHS pension contributions for a monthly period
 */
export async function calculateNHSPension(
  monthlySalary: number,
  previousYearPensionablePay: number | null,
  taxYear: string = '2025/26',
  isNHSPensionMember: boolean = false
): Promise<NHSPensionResult> {
  // If not an NHS pension member, return zero contributions
  if (!isNHSPensionMember) {
    return {
      employeeContribution: 0,
      employerContribution: 0,
      tier: 0,
      employeeRate: 0,
      employerRate: 0
    };
  }

  payrollLogger.debug('NHS pension calculation started', { 
    taxYear,
    hasPreviousYearPay: previousYearPensionablePay !== null && previousYearPensionablePay > 0
  }, 'PENSION');

  // Get NHS pension bands for the tax year
  const bands = await getNHSPensionBands(taxYear);
  
  if (bands.length === 0) {
    payrollLogger.warn('No NHS pension bands found', { taxYear }, 'PENSION');
    return {
      employeeContribution: 0,
      employerContribution: 0,
      tier: 0,
      employeeRate: 0,
      employerRate: 0
    };
  }

  // Determine annual pensionable pay for tier calculation
  let annualPensionablePay: number;
  
  if (previousYearPensionablePay && previousYearPensionablePay > 0) {
    // Use previous year's pensionable pay if available
    annualPensionablePay = previousYearPensionablePay;
    payrollLogger.debug('Using previous year pensionable pay for tier', { 
      taxYear,
      usePreviousYear: true
    }, 'PENSION');
  } else {
    // Use current annual salary (monthly salary * 12)
    annualPensionablePay = monthlySalary * 12;
    payrollLogger.debug('Using current annual salary for tier', { 
      taxYear,
      usePreviousYear: false
    }, 'PENSION');
  }

  // Determine the appropriate tier
  const tierBand = determineNHSPensionTier(annualPensionablePay, bands);
  
  if (!tierBand) {
    payrollLogger.warn('No tier found for annual pay', { taxYear }, 'PENSION');
    return {
      employeeContribution: 0,
      employerContribution: 0,
      tier: 0,
      employeeRate: 0,
      employerRate: 0
    };
  }

  payrollLogger.debug('NHS pension tier determined', { 
    tier: tierBand.tier_number,
    employeeRatePercent: tierBand.employee_contribution_rate,
    employerRatePercent: tierBand.employer_contribution_rate
  }, 'PENSION');

  // Calculate monthly contributions
  const employeeRate = tierBand.employee_contribution_rate / 100;
  const employerRate = tierBand.employer_contribution_rate / 100;
  
  const employeeContribution = monthlySalary * employeeRate;
  const employerContribution = monthlySalary * employerRate;

  payrollLogger.calculation('NHS pension contributions', {
    tier: tierBand.tier_number,
    employeeContribution,
    employerContribution
  }, 'PENSION');

  return {
    employeeContribution,
    employerContribution,
    tier: tierBand.tier_number,
    employeeRate: tierBand.employee_contribution_rate,
    employerRate: tierBand.employer_contribution_rate
  };
}

/**
 * Get NHS pension band information for display purposes
 */
export async function getNHSPensionBandInfo(taxYear: string = '2025/26'): Promise<NHSPensionBand[]> {
  return getNHSPensionBands(taxYear);
}

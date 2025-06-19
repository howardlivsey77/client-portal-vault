
import { supabase } from "@/integrations/supabase/client";
import { roundToTwoDecimals } from "@/lib/formatters";

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
      console.error('Error fetching NHS pension bands:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getNHSPensionBands:', error);
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

  console.log(`[NHS PENSION] Calculating for monthly salary: £${monthlySalary}, previous year pay: £${previousYearPensionablePay || 'N/A'}`);

  // Get NHS pension bands for the tax year
  const bands = await getNHSPensionBands(taxYear);
  
  if (bands.length === 0) {
    console.warn(`[NHS PENSION] No NHS pension bands found for tax year ${taxYear}`);
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
    console.log(`[NHS PENSION] Using previous year pensionable pay: £${annualPensionablePay}`);
  } else {
    // Use current annual salary (monthly salary * 12)
    annualPensionablePay = monthlySalary * 12;
    console.log(`[NHS PENSION] Using current annual salary: £${annualPensionablePay}`);
  }

  // Determine the appropriate tier
  const tierBand = determineNHSPensionTier(annualPensionablePay, bands);
  
  if (!tierBand) {
    console.warn(`[NHS PENSION] No tier found for annual pay: £${annualPensionablePay}`);
    return {
      employeeContribution: 0,
      employerContribution: 0,
      tier: 0,
      employeeRate: 0,
      employerRate: 0
    };
  }

  console.log(`[NHS PENSION] Determined tier ${tierBand.tier_number} with employee rate ${tierBand.employee_contribution_rate}% and employer rate ${tierBand.employer_contribution_rate}%`);

  // Calculate monthly contributions
  const employeeRate = tierBand.employee_contribution_rate / 100;
  const employerRate = tierBand.employer_contribution_rate / 100;
  
  const employeeContribution = roundToTwoDecimals(monthlySalary * employeeRate);
  const employerContribution = roundToTwoDecimals(monthlySalary * employerRate);

  console.log(`[NHS PENSION] Monthly contributions - Employee: £${employeeContribution}, Employer: £${employerContribution}`);

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

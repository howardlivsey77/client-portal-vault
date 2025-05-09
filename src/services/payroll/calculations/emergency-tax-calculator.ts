
import { roundToTwoDecimals } from "@/lib/formatters";
import { TaxBandCollection } from "./income-tax-types";
import { calculateMonthlyUKTax } from "./uk-tax-calculator";
import { calculateMonthlyScottishTax } from "./scottish-tax-calculator";

/**
 * Calculate emergency tax (Week1/Month1 basis)
 * @param monthlySalary - Monthly salary
 * @param monthlyAllowance - Monthly tax-free allowance
 * @param region - Tax region (UK, Scotland, Wales)
 * @param taxBands - Collection of tax bands with thresholds and rates
 * @returns Tax amount
 */
export function calculateEmergencyTax(
  monthlySalary: number,
  monthlyAllowance: number,
  region: string,
  taxBands: TaxBandCollection
): number {
  // Calculate taxable income after allowance
  const taxableMonthlyIncome = Math.max(0, monthlySalary - monthlyAllowance);
  
  // Use the appropriate calculator based on region
  if (region === 'Scotland') {
    return calculateMonthlyScottishTax(taxableMonthlyIncome, taxBands);
  } else {
    // UK or Wales
    return calculateMonthlyUKTax(taxableMonthlyIncome, taxBands);
  }
}

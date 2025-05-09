
import { TAX_BANDS } from "../constants/tax-constants";
import { parseTaxCode } from "../utils/tax-code-utils";
import { roundToTwoDecimals } from "@/lib/formatters";

/**
 * Calculate income tax based on annual salary and tax code
 */
export function calculateIncomeTax(annualSalary: number, taxCode: string): number {
  const { allowance } = parseTaxCode(taxCode);
  let taxableIncome = Math.max(0, annualSalary - allowance);
  let tax = 0;
  
  // Calculate tax for each band
  if (taxableIncome > TAX_BANDS.HIGHER_RATE.threshold) {
    tax += (taxableIncome - TAX_BANDS.HIGHER_RATE.threshold) * TAX_BANDS.ADDITIONAL_RATE.rate;
    taxableIncome = TAX_BANDS.HIGHER_RATE.threshold;
  }
  
  if (taxableIncome > TAX_BANDS.BASIC_RATE.threshold) {
    tax += (taxableIncome - TAX_BANDS.BASIC_RATE.threshold) * TAX_BANDS.HIGHER_RATE.rate;
    taxableIncome = TAX_BANDS.BASIC_RATE.threshold;
  }
  
  if (taxableIncome > TAX_BANDS.PERSONAL_ALLOWANCE.threshold) {
    tax += (taxableIncome - TAX_BANDS.PERSONAL_ALLOWANCE.threshold) * TAX_BANDS.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate monthly income tax
 */
export function calculateMonthlyIncomeTax(monthlySalary: number, taxCode: string): number {
  const annualSalary = monthlySalary * 12;
  const annualTax = calculateIncomeTax(annualSalary, taxCode);
  return roundToTwoDecimals(annualTax / 12);
}

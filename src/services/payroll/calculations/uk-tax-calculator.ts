
import { roundToTwoDecimals } from "@/lib/formatters";
import { TaxBandCollection } from "./income-tax-types";

/**
 * Calculate income tax for UK/Wales regions based on tax bands
 * @param taxableIncome - Taxable income after allowance deductions
 * @param taxBands - Collection of tax bands with thresholds and rates
 * @returns Tax amount
 */
export function calculateUKTax(taxableIncome: number, taxBands: TaxBandCollection): number {
  let tax = 0;
  let remainingIncome = taxableIncome;
  
  // Apply Additional Rate (highest band)
  if (remainingIncome > taxBands.HIGHER_RATE.threshold) {
    tax += (remainingIncome - taxBands.HIGHER_RATE.threshold) * taxBands.ADDITIONAL_RATE.rate;
    remainingIncome = taxBands.HIGHER_RATE.threshold;
  }
  
  // Apply Higher Rate (middle band)
  if (remainingIncome > taxBands.BASIC_RATE.threshold) {
    tax += (remainingIncome - taxBands.BASIC_RATE.threshold) * taxBands.HIGHER_RATE.rate;
    remainingIncome = taxBands.BASIC_RATE.threshold;
  }
  
  // Apply Basic Rate (lowest band)
  if (remainingIncome > taxBands.PERSONAL_ALLOWANCE.threshold) {
    tax += (remainingIncome - taxBands.PERSONAL_ALLOWANCE.threshold) * taxBands.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate monthly income tax for UK/Wales regions based on tax bands
 * @param taxableMonthlyIncome - Monthly taxable income after allowance deductions
 * @param taxBands - Collection of tax bands with thresholds and rates
 * @returns Tax amount
 */
export function calculateMonthlyUKTax(taxableMonthlyIncome: number, taxBands: TaxBandCollection): number {
  let tax = 0;
  let remainingIncome = taxableMonthlyIncome;
  
  // Convert annual thresholds to monthly
  const monthlyBasicThreshold = taxBands.BASIC_RATE.threshold / 12;
  const monthlyHigherThreshold = taxBands.HIGHER_RATE.threshold / 12;
  
  // Apply Additional Rate (highest band)
  if (remainingIncome > monthlyHigherThreshold) {
    tax += (remainingIncome - monthlyHigherThreshold) * taxBands.ADDITIONAL_RATE.rate;
    remainingIncome = monthlyHigherThreshold;
  }
  
  // Apply Higher Rate (middle band)
  if (remainingIncome > monthlyBasicThreshold) {
    tax += (remainingIncome - monthlyBasicThreshold) * taxBands.HIGHER_RATE.rate;
    remainingIncome = monthlyBasicThreshold;
  }
  
  // Apply Basic Rate (lowest band)
  if (remainingIncome > 0) {
    tax += remainingIncome * taxBands.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

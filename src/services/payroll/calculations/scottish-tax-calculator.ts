
import { roundToTwoDecimals } from "@/lib/formatters";
import { TaxBandCollection } from "./income-tax-types";

/**
 * Calculate income tax for Scottish region based on tax bands
 * @param taxableIncome - Taxable income after allowance deductions
 * @param taxBands - Collection of tax bands with thresholds and rates
 * @returns Tax amount
 */
export function calculateScottishTax(taxableIncome: number, taxBands: TaxBandCollection): number {
  let tax = 0;
  let remainingIncome = taxableIncome;
  
  // Apply Additional Rate (highest band)
  if (remainingIncome > taxBands.HIGHER_RATE.threshold) {
    tax += (remainingIncome - taxBands.HIGHER_RATE.threshold) * taxBands.ADDITIONAL_RATE.rate;
    remainingIncome = taxBands.HIGHER_RATE.threshold;
  }
  
  // Apply Higher Rate
  if (remainingIncome > taxBands.INTERMEDIATE_RATE.threshold) {
    tax += (remainingIncome - taxBands.INTERMEDIATE_RATE.threshold) * taxBands.HIGHER_RATE.rate;
    remainingIncome = taxBands.INTERMEDIATE_RATE.threshold;
  }
  
  // Apply Intermediate Rate
  if (remainingIncome > taxBands.BASIC_RATE.threshold) {
    tax += (remainingIncome - taxBands.BASIC_RATE.threshold) * taxBands.INTERMEDIATE_RATE.rate;
    remainingIncome = taxBands.BASIC_RATE.threshold;
  }
  
  // Apply Basic Rate
  if (remainingIncome > taxBands.STARTER_RATE.threshold) {
    tax += (remainingIncome - taxBands.STARTER_RATE.threshold) * taxBands.BASIC_RATE.rate;
    remainingIncome = taxBands.STARTER_RATE.threshold;
  }
  
  // Apply Starter Rate
  if (remainingIncome > taxBands.PERSONAL_ALLOWANCE.threshold) {
    tax += (remainingIncome - taxBands.PERSONAL_ALLOWANCE.threshold) * taxBands.STARTER_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate monthly income tax for Scottish region based on tax bands
 * @param taxableMonthlyIncome - Monthly taxable income after allowance deductions
 * @param taxBands - Collection of tax bands with thresholds and rates
 * @returns Tax amount
 */
export function calculateMonthlyScottishTax(taxableMonthlyIncome: number, taxBands: TaxBandCollection): number {
  let tax = 0;
  let remainingIncome = taxableMonthlyIncome;
  
  // Convert annual thresholds to monthly
  const monthlyThresholds = {
    starter: taxBands.STARTER_RATE.threshold / 12,
    basic: taxBands.BASIC_RATE.threshold / 12,
    intermediate: taxBands.INTERMEDIATE_RATE.threshold / 12,
    higher: taxBands.HIGHER_RATE.threshold / 12,
    additional: Infinity
  };
  
  // Apply Additional Rate (highest band)
  if (remainingIncome > monthlyThresholds.higher) {
    tax += (remainingIncome - monthlyThresholds.higher) * taxBands.ADDITIONAL_RATE.rate;
    remainingIncome = monthlyThresholds.higher;
  }
  
  // Apply Higher Rate
  if (remainingIncome > monthlyThresholds.intermediate) {
    tax += (remainingIncome - monthlyThresholds.intermediate) * taxBands.HIGHER_RATE.rate;
    remainingIncome = monthlyThresholds.intermediate;
  }
  
  // Apply Intermediate Rate
  if (remainingIncome > monthlyThresholds.basic) {
    tax += (remainingIncome - monthlyThresholds.basic) * taxBands.INTERMEDIATE_RATE.rate;
    remainingIncome = monthlyThresholds.basic;
  }
  
  // Apply Basic Rate
  if (remainingIncome > monthlyThresholds.starter) {
    tax += (remainingIncome - monthlyThresholds.starter) * taxBands.BASIC_RATE.rate;
    remainingIncome = monthlyThresholds.starter;
  }
  
  // Apply Starter Rate
  if (remainingIncome > 0) {
    tax += remainingIncome * taxBands.STARTER_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

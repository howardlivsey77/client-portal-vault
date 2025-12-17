
import { NICalculationResult } from "./types";
import { calculateNationalInsuranceFallback } from "./calculation-utils";
import { NationalInsuranceCalculator } from "./services/NationalInsuranceCalculator";
import { getCurrentTaxYear } from "@/services/payroll/utils/taxYearUtils";

/**
 * Calculate National Insurance contributions using database values when available
 * Uses the new NationalInsuranceCalculator service
 */
export async function calculateNationalInsuranceAsync(monthlySalary: number, taxYear?: string): Promise<NICalculationResult> {
  try {
    // Use the NI calculator service - defaults to current tax year
    const calculator = new NationalInsuranceCalculator(taxYear, process.env.NODE_ENV === 'development');
    return await calculator.calculate(monthlySalary);
  } catch (error) {
    console.error("[NI] Error in calculateNationalInsuranceAsync:", error);
    // Fall back to constants-based calculation
    return calculateNationalInsuranceFallback(monthlySalary);
  }
}

/**
 * Calculate National Insurance contributions using constants
 * (Legacy method, kept for fallback)
 */
export function calculateNationalInsurance(monthlySalary: number): number {
  const niResult = calculateNationalInsuranceFallback(monthlySalary);
  return niResult.nationalInsurance;
}

// Re-export everything needed for backwards compatibility
export type { NICalculationResult } from './types';
export { NationalInsuranceCalculator } from './services/NationalInsuranceCalculator';
export { NICalculationIntegrityError } from './errors';

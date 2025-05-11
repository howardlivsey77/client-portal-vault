
import { NICalculationResult } from "./types";
import { fetchNIBands } from "./database";
import { calculateFromBands, calculateNationalInsuranceFallback } from "./calculation-utils";
import { roundToTwoDecimals } from "@/lib/formatters";
import { NationalInsuranceCalculator } from "./services/NationalInsuranceCalculator";

// Create a singleton instance for the current tax year
const niCalculator = new NationalInsuranceCalculator('2025/26', true);

/**
 * Calculate National Insurance contributions using database values when available
 * Uses the new NationalInsuranceCalculator service
 */
export async function calculateNationalInsuranceAsync(monthlySalary: number, taxYear: string = '2025/26'): Promise<NICalculationResult> {
  try {
    console.log(`[NI DEBUG] Calculating NI for monthly salary: £${monthlySalary} using NI calculator service`);
    
    // Use the NI calculator service
    const calculator = new NationalInsuranceCalculator(taxYear, true);
    return await calculator.calculate(monthlySalary);
  } catch (error) {
    console.error("[NI DEBUG] Error in calculateNationalInsuranceAsync:", error);
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

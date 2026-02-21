
import { parseTaxCode } from "../utils/tax-code-utils";
import { 
  getIncomeTaxBands, 
  clearTaxBandsCache, 
  calculateTaxByBands 
} from "../utils/tax-bands-utils";
import { calculateCumulativeTax, calculateWeek1Month1Tax } from "./cumulative-tax";

/**
 * Re-export cumulative tax calculation for external use
 */
export { 
  calculateCumulativeTax, 
  calculateCumulativeTaxSync,
  type CumulativeTaxResult 
} from './cumulative-tax';

/**
 * Re-export clearTaxBandsCache for external use
 */
export { clearTaxBandsCache, getIncomeTaxBands };

/**
 * Calculate monthly tax using HMRC-compliant cumulative or W1/M1 method.
 *
 * @param monthlySalary   - Gross pay this period (niableGrossPay from orchestrator)
 * @param taxCode         - Employee tax code
 * @param taxYear         - Tax year string
 * @param period          - Tax month 1–12 (defaults to 1 if absent)
 * @param grossPayYTD     - Gross pay YTD before this period (defaults to 0)
 * @param taxPaidYTD      - Tax paid YTD before this period (defaults to 0)
 * @param isMonth1Basis   - true = W1/M1 non-cumulative basis
 */
export async function calculateMonthlyIncomeTaxAsync(
  monthlySalary: number,
  taxCode: string,
  taxYear?: string,
  period: number = 1,
  grossPayYTD: number = 0,
  taxPaidYTD: number = 0,
  isMonth1Basis: boolean = false
): Promise<{
  monthlyTax: number;
  freePay: number;
  freePayYTD: number;
  taxablePayYTD: number;
}> {
  if (isMonth1Basis) {
    const result = await calculateWeek1Month1Tax(monthlySalary, taxCode, taxYear);
    return {
      monthlyTax: result.taxThisPeriod,
      freePay: result.freePayMonthly,
      freePayYTD: result.freePayMonthly, // For M1, freePayYTD = freePayMonthly
      taxablePayYTD: result.taxablePayThisPeriod, // For M1, no YTD concept
    };
  }

  // Cumulative basis: grossPayYTD passed in is BEFORE this period's pay
  const cumulativeGrossYTD = grossPayYTD + monthlySalary;

  const result = await calculateCumulativeTax(
    period,
    cumulativeGrossYTD,
    taxCode,
    taxPaidYTD,
    taxYear,
    monthlySalary // Pass period gross for regulatory limit
  );

  return {
    monthlyTax: result.taxThisPeriod,
    freePay: result.freePayMonthly,
    freePayYTD: result.freePayYTD,
    taxablePayYTD: result.taxablePayYTD,
  };
}

/**
 * Calculate annual income tax based on salary and tax code (async version)
 */
export async function calculateIncomeTaxAsync(annualSalary: number, taxCode: string, taxYear?: string): Promise<number> {
  const { allowance } = parseTaxCode(taxCode);
  const taxableIncome = Math.max(0, annualSalary - allowance);
  
  const taxBands = await getIncomeTaxBands(taxYear);
  const tax = calculateTaxByBands(taxableIncome, taxBands);
  
  return tax;
}

/**
 * @deprecated BROKEN — fires an async call but returns 0 synchronously.
 * Use `calculateIncomeTaxAsync` instead.
 * @throws {Error} Always throws to prevent silent incorrect results.
 */
export function calculateIncomeTax(_annualSalary: number, _taxCode: string): never {
  throw new Error(
    '[calculateIncomeTax] BROKEN: This synchronous wrapper returns 0 and silently discards the real result. ' +
    'Use calculateIncomeTaxAsync instead.'
  );
}

/**
 * @deprecated BROKEN — delegates to calculateIncomeTax which is broken.
 * Use `calculateMonthlyIncomeTaxAsync` instead.
 * @throws {Error} Always throws to prevent silent incorrect results.
 */
export function calculateMonthlyIncomeTax(_monthlySalary: number, _taxCode: string): never {
  throw new Error(
    '[calculateMonthlyIncomeTax] BROKEN: Delegates to the broken synchronous calculateIncomeTax. ' +
    'Use calculateMonthlyIncomeTaxAsync instead.'
  );
}

/**
 * Calculate income tax based on YTD taxable pay (async version)
 */
export async function calculateIncomeTaxFromYTDAsync(taxablePayYTD: number, taxCode: string, taxYear?: string): Promise<number> {
  const taxBands = await getIncomeTaxBands(taxYear);
  const tax = calculateTaxByBands(taxablePayYTD, taxBands);
  return tax;
}

/**
 * @deprecated BROKEN — fires an async call but returns 0 synchronously.
 * Use `calculateIncomeTaxFromYTDAsync` instead.
 * @throws {Error} Always throws to prevent silent incorrect results.
 */
export function calculateIncomeTaxFromYTD(_taxablePayYTD: number, _taxCode: string): never {
  throw new Error(
    '[calculateIncomeTaxFromYTD] BROKEN: This synchronous wrapper returns 0 and silently discards the real result. ' +
    'Use calculateIncomeTaxFromYTDAsync instead.'
  );
}

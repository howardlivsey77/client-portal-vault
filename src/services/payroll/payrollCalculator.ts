/**
 * Main Payroll Calculator
 *
 * ROUNDING STRATEGY (HMRC-compliant):
 *
 * 1. All intermediate calculations use full precision (unrounded)
 * 2. Taxable pay: Rounded DOWN to nearest pound (HMRC requirement)
 * 3. Final output values: Rounded to 2 decimal places
 * 4. Database storage: Values stored in pennies as integers
 *
 * WARNING: Do not re-add rounded values in downstream systems to avoid penny drift.
 * All rounding occurs at the OUTPUT boundary only.
 */

import { calculateStudentLoan } from "./calculations/student-loan";
import { PayrollDetails, PayrollResult } from "./types";
import { payrollLogger } from "./utils/payrollLogger";
import { getCurrentTaxYear } from "./utils/taxYearUtils";
import { PayrollCalculationError } from "./errors/PayrollCalculationError";

// Import phase functions from internal module
import {
  calculateEarnings,
  calculateTaxDeductions,
  calculateNIContributions,
  calculatePensionDeductions,
  assemblePayrollResult,
} from "./payrollCalculator.internal";

// ---------------------------------------------------------------------------
// Orchestrator (public API — signature unchanged)
// ---------------------------------------------------------------------------

/**
 * Main function to calculate monthly payroll.
 *
 * @param details Payroll details including employee info, salary, tax code, etc.
 * @returns Calculated payroll result
 * @throws PayrollCalculationError with specific error codes for different failure types
 */
export async function calculateMonthlyPayroll(details: PayrollDetails): Promise<PayrollResult> {
  const {
    employeeId,
    monthlySalary,
    taxCode,
    pensionPercentage = 0,
    studentLoanPlan = null,
    additionalEarnings = [],
    additionalDeductions = [],
    additionalAllowances = [],
    isNHSPensionMember = false,
    previousYearPensionablePay = null,
    taxYear: providedTaxYear,
  } = details;

  const taxYear = providedTaxYear || getCurrentTaxYear();

  // --- Input validation ---

  if (!employeeId?.trim()) {
    throw new PayrollCalculationError(
      'INVALID_INPUT',
      'employeeId is required',
      undefined,
      { employeeId }
    );
  }

  if (typeof monthlySalary !== 'number' || isNaN(monthlySalary) || monthlySalary < 0) {
    throw new PayrollCalculationError(
      'INVALID_INPUT',
      'monthlySalary must be a non-negative number',
      undefined,
      { employeeId }
    );
  }

  if (!taxCode?.trim()) {
    throw new PayrollCalculationError(
      'INVALID_INPUT',
      'taxCode is required',
      undefined,
      { employeeId }
    );
  }

  if (pensionPercentage < 0 || pensionPercentage > 100) {
    throw new PayrollCalculationError(
      'INVALID_INPUT',
      'pensionPercentage must be between 0 and 100',
      undefined,
      { employeeId, pensionPercentage }
    );
  }

  if (previousYearPensionablePay !== null && previousYearPensionablePay < 0) {
    throw new PayrollCalculationError(
      'INVALID_INPUT',
      'previousYearPensionablePay must be non-negative if provided',
      undefined,
      { employeeId }
    );
  }

  for (const item of additionalEarnings) {
    if (typeof item.amount !== 'number' || isNaN(item.amount)) {
      throw new PayrollCalculationError(
        'INVALID_INPUT',
        'All additionalEarnings items must have a numeric amount',
        undefined,
        { employeeId }
      );
    }
  }

  for (const item of additionalDeductions) {
    if (typeof item.amount !== 'number' || isNaN(item.amount) || item.amount < 0) {
      throw new PayrollCalculationError(
        'INVALID_INPUT',
        'All additionalDeductions items must have a non-negative numeric amount',
        undefined,
        { employeeId }
      );
    }
  }

  for (const item of additionalAllowances) {
    if (typeof item.amount !== 'number' || isNaN(item.amount) || item.amount < 0) {
      throw new PayrollCalculationError(
        'INVALID_INPUT',
        'All additionalAllowances items must have a non-negative numeric amount',
        undefined,
        { employeeId }
      );
    }
  }

  // --- End input validation ---

  payrollLogger.debug("Starting payroll calculation", {
    employeeId,
    taxYear,
    hasNHSPension: isNHSPensionMember,
    hasAdditionalEarnings: additionalEarnings.length > 0,
    hasStudentLoan: studentLoanPlan !== null,
    studentLoanPlan,
    hasPension: pensionPercentage > 0,
  });

  const earnings = calculateEarnings(monthlySalary, additionalEarnings);

  const [tax, ni, pensions] = await Promise.all([
    calculateTaxDeductions(earnings.grossPay, taxCode, taxYear, employeeId),
    calculateNIContributions(earnings.grossPay, taxYear, employeeId),
    calculatePensionDeductions(
      earnings.grossPay,
      monthlySalary,
      pensionPercentage,
      previousYearPensionablePay,
      taxYear,
      isNHSPensionMember,
      employeeId
    ),
  ]);

  // Student loan is calculated on base monthly salary only — not grossPay.
  // Per SLC/HMRC guidance: https://www.gov.uk/guidance/paye-collection-of-student-loans
  const studentLoan = calculateStudentLoan(monthlySalary, studentLoanPlan);

  const result = assemblePayrollResult(details, taxYear, earnings, tax, ni, pensions, studentLoan);

  payrollLogger.debug("Payroll calculation complete", {
    employeeId,
    taxYear,
    calculationSuccess: true,
  });

  return result;
}

// ---------------------------------------------------------------------------
// Re-exports (unchanged — public API preserved)
// ---------------------------------------------------------------------------

export * from "./calculations/income-tax";
export * from "./calculations/national-insurance";
export * from "./calculations/student-loan";
export * from "./calculations/pension";
export * from "./calculations/nhs-pension";
export * from "./utils/tax-code-utils";
export * from "./constants/tax-constants";
export * from "./types";

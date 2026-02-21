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
import { getCurrentTaxYear, getTaxPeriod } from "./utils/taxYearUtils";
import { PayrollCalculationError } from "./errors/PayrollCalculationError";
import type { NICategory } from "./constants/tax-constants";

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
    reimbursements = [],
    isNHSPensionMember = false,
    previousYearPensionablePay = null,
    taxYear: providedTaxYear,
    niCategory = 'A' as NICategory,
    period = getTaxPeriod(),
    grossPayYTD = 0,
    taxPaidYTD = 0,
    isMonth1Basis = false,
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

  if (typeof period !== 'number' || period < 1 || period > 12) {
    throw new PayrollCalculationError(
      'INVALID_INPUT',
      'period must be between 1 and 12',
      undefined,
      { employeeId }
    );
  }

  if (grossPayYTD < 0) {
    throw new PayrollCalculationError(
      'INVALID_INPUT',
      'grossPayYTD must be non-negative',
      undefined,
      { employeeId }
    );
  }

  if (taxPaidYTD < 0) {
    throw new PayrollCalculationError(
      'INVALID_INPUT',
      'taxPaidYTD must be non-negative',
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

  for (const item of reimbursements) {
    if (typeof item.amount !== 'number' || isNaN(item.amount) || item.amount < 0) {
      throw new PayrollCalculationError(
        'INVALID_INPUT',
        'All reimbursements items must have a non-negative numeric amount',
        undefined,
        { employeeId }
      );
    }
  }

  // --- End input validation ---

  const VALID_NI_CATEGORIES: NICategory[] = ['A', 'B', 'C', 'M', 'H', 'Z', 'J', 'V'];
  if (details.niCategory && !VALID_NI_CATEGORIES.includes(details.niCategory)) {
    throw new PayrollCalculationError(
      'INVALID_INPUT',
      `niCategory must be one of: ${VALID_NI_CATEGORIES.join(', ')}`,
      undefined,
      { employeeId, niCategory: details.niCategory }
    );
  }

  payrollLogger.debug("Starting payroll calculation", {
    employeeId,
    taxYear,
    hasNHSPension: isNHSPensionMember,
    hasAdditionalEarnings: additionalEarnings.length > 0,
    hasReimbursements: reimbursements.length > 0,
    hasStudentLoan: studentLoanPlan !== null,
    studentLoanPlan,
    hasPension: pensionPercentage > 0,
    niCategory,
    period,
    isMonth1Basis,
  });

  const earnings = calculateEarnings(monthlySalary, additionalEarnings, reimbursements);

  const [tax, ni, pensions] = await Promise.all([
    calculateTaxDeductions(
      earnings.niableGrossPay,
      taxCode,
      taxYear,
      employeeId,
      period,
      grossPayYTD,
      taxPaidYTD,
      isMonth1Basis
    ),
    calculateNIContributions(earnings.niableGrossPay, taxYear, employeeId, niCategory),
    calculatePensionDeductions(
      earnings.niableGrossPay,
      monthlySalary,
      pensionPercentage,
      previousYearPensionablePay,
      taxYear,
      isNHSPensionMember,
      employeeId
    ),
  ]);

  // Student loan: calculated on NI-able gross pay per HMRC spec
  const studentLoan = calculateStudentLoan(earnings.niableGrossPay, studentLoanPlan);

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

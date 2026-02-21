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

import { roundToTwoDecimals } from "@/lib/formatters";
import { calculateMonthlyIncomeTaxAsync } from "./calculations/income-tax";
import { NICalculationResult } from "./calculations/national-insurance";
import { calculateStudentLoan } from "./calculations/student-loan";
import { calculatePension } from "./calculations/pension";
import { calculateNHSPension } from "./calculations/nhs-pension";
import { PayrollDetails, PayrollResult } from "./types";
import { NationalInsuranceCalculator } from "./calculations/ni/services/NationalInsuranceCalculator";
import { payrollLogger } from "./utils/payrollLogger";
import { getCurrentTaxYear } from "./utils/taxYearUtils";
import { roundDownToNearestPound } from "./utils/roundingUtils";
import { PayrollCalculationError } from "./errors/PayrollCalculationError";

// ---------------------------------------------------------------------------
// Inter-phase result types
// ---------------------------------------------------------------------------

interface EarningsResult {
  grossPay: number;
  totalAdditionalEarnings: number;
}

interface TaxResult {
  incomeTax: number;
  freePay: number;
  taxablePay: number;
}

interface NIResult {
  nationalInsurance: number;
  employerNationalInsurance: number;
  earningsAtLEL: number;
  earningsLELtoPT: number;
  earningsPTtoUEL: number;
  earningsAboveUEL: number;
  earningsAboveST: number;
}

interface PensionResult {
  pensionContribution: number;
  nhsPensionEmployeeContribution: number;
  nhsPensionEmployerContribution: number;
  nhsPensionTier: number;
  nhsPensionEmployeeRate: number;
  nhsPensionEmployerRate: number;
}

// ---------------------------------------------------------------------------
// Phase 1 — Earnings
// ---------------------------------------------------------------------------

function calculateEarnings(
  monthlySalary: number,
  additionalEarnings: Array<{ amount: number }>
): EarningsResult {
  const totalAdditionalEarnings =
    additionalEarnings?.reduce((sum, item) => sum + item.amount, 0) ?? 0;
  const grossPay = monthlySalary + totalAdditionalEarnings;

  payrollLogger.calculation("Gross pay", {
    monthlySalary,
    additionalEarnings: totalAdditionalEarnings,
    grossPay,
  });

  return { grossPay, totalAdditionalEarnings };
}

// ---------------------------------------------------------------------------
// Phase 2 — Income tax
// ---------------------------------------------------------------------------

async function calculateTaxDeductions(
  grossPay: number,
  taxCode: string,
  taxYear: string,
  employeeId: string
): Promise<TaxResult> {
  let incomeTaxResult;
  try {
    incomeTaxResult = await calculateMonthlyIncomeTaxAsync(grossPay, taxCode, taxYear);
  } catch (err) {
    payrollLogger.error("Income tax calculation failed", err, "TAX_CALC");
    throw new PayrollCalculationError(
      "INCOME_TAX_FAILED",
      "Failed to calculate income tax",
      err instanceof Error ? err : undefined,
      { taxCode, taxYear, employeeId }
    );
  }

  const { monthlyTax: incomeTax, freePay } = incomeTaxResult;

  // Round down to nearest pound — HMRC requirement
  const taxablePay = roundDownToNearestPound(grossPay - freePay);

  payrollLogger.calculation("Income tax", { incomeTax, freePay, taxablePay });

  return { incomeTax, freePay, taxablePay };
}

// ---------------------------------------------------------------------------
// Phase 3 — National Insurance
// ---------------------------------------------------------------------------

async function calculateNIContributions(
  grossPay: number,
  taxYear: string,
  employeeId: string
): Promise<NIResult> {
  let niResult: NICalculationResult;
  try {
    const niCalculator = new NationalInsuranceCalculator(taxYear, false);
    niResult = await niCalculator.calculate(grossPay);
  } catch (err) {
    payrollLogger.error("NI calculation failed", err, "NI_CALC");
    throw new PayrollCalculationError(
      "NI_CALCULATION_FAILED",
      "Failed to calculate National Insurance",
      err instanceof Error ? err : undefined,
      { taxYear, employeeId }
    );
  }

  const {
    nationalInsurance,
    employerNationalInsurance,
    earningsAtLEL,
    earningsLELtoPT,
    earningsPTtoUEL,
    earningsAboveUEL,
    earningsAboveST,
  } = niResult;

  payrollLogger.calculation(
    "NI bands",
    {
      earningsAtLEL,
      earningsLELtoPT,
      earningsPTtoUEL,
      earningsAboveUEL,
      earningsAboveST,
      nationalInsurance,
      employerNationalInsurance,
    },
    "NI_CALC"
  );

  return {
    nationalInsurance,
    employerNationalInsurance,
    earningsAtLEL,
    earningsLELtoPT,
    earningsPTtoUEL,
    earningsAboveUEL,
    earningsAboveST,
  };
}

// ---------------------------------------------------------------------------
// Phase 4 — Pension deductions
// ---------------------------------------------------------------------------

async function calculatePensionDeductions(
  grossPay: number,
  monthlySalary: number,
  pensionPercentage: number,
  previousYearPensionablePay: number | null,
  taxYear: string,
  isNHSPensionMember: boolean,
  employeeId: string
): Promise<PensionResult> {
  const pensionContribution = calculatePension(grossPay, pensionPercentage);

  let nhsPensionResult;
  try {
    nhsPensionResult = await calculateNHSPension(
      monthlySalary,
      previousYearPensionablePay,
      taxYear,
      isNHSPensionMember
    );
  } catch (err) {
    payrollLogger.error("NHS pension calculation failed", err, "PENSION");
    throw new PayrollCalculationError(
      "NHS_PENSION_FAILED",
      "Failed to calculate NHS pension contributions",
      err instanceof Error ? err : undefined,
      { taxYear, employeeId, isNHSPensionMember }
    );
  }

  payrollLogger.calculation(
    "Pension",
    {
      pensionContribution,
      employeeContribution: nhsPensionResult.employeeContribution,
      employerContribution: nhsPensionResult.employerContribution,
      tier: nhsPensionResult.tier,
    },
    "PENSION"
  );

  return {
    pensionContribution,
    nhsPensionEmployeeContribution: nhsPensionResult.employeeContribution,
    nhsPensionEmployerContribution: nhsPensionResult.employerContribution,
    nhsPensionTier: nhsPensionResult.tier,
    nhsPensionEmployeeRate: nhsPensionResult.employeeRate,
    nhsPensionEmployerRate: nhsPensionResult.employerRate,
  };
}

// ---------------------------------------------------------------------------
// Phase 5 — Result assembly (all rounding lives here)
// ---------------------------------------------------------------------------

function assemblePayrollResult(
  details: PayrollDetails,
  taxYear: string,
  earnings: EarningsResult,
  tax: TaxResult,
  ni: NIResult,
  pensions: PensionResult,
  studentLoan: number
): PayrollResult {
  const {
    employeeId,
    employeeName,
    payrollId,
    monthlySalary,
    taxCode,
    pensionPercentage = 0,
    studentLoanPlan = null,
    additionalDeductions = [],
    additionalAllowances = [],
    additionalEarnings = [],
    isNHSPensionMember = false,
  } = details;

  const totalAdditionalDeductions = additionalDeductions.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalAdditionalAllowances = additionalAllowances.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const totalDeductions =
    tax.incomeTax +
    ni.nationalInsurance +
    studentLoan +
    pensions.pensionContribution +
    pensions.nhsPensionEmployeeContribution +
    totalAdditionalDeductions;

  const totalAllowances = totalAdditionalAllowances;
  const netPay = earnings.grossPay - totalDeductions + totalAllowances;

  payrollLogger.calculation("Final totals", { totalDeductions, totalAllowances, netPay });

  return {
    employeeId,
    employeeName,
    payrollId,
    monthlySalary,
    grossPay: roundToTwoDecimals(earnings.grossPay),
    taxablePay: roundToTwoDecimals(tax.taxablePay),
    incomeTax: roundToTwoDecimals(tax.incomeTax),
    nationalInsurance: roundToTwoDecimals(ni.nationalInsurance),
    employerNationalInsurance: roundToTwoDecimals(ni.employerNationalInsurance),
    studentLoan: roundToTwoDecimals(studentLoan),
    studentLoanPlan,
    pensionContribution: roundToTwoDecimals(pensions.pensionContribution),
    pensionPercentage,
    additionalDeductions,
    additionalAllowances,
    additionalEarnings,
    totalDeductions: roundToTwoDecimals(totalDeductions),
    totalAllowances: roundToTwoDecimals(totalAllowances),
    netPay: roundToTwoDecimals(netPay),
    freePay: roundToTwoDecimals(tax.freePay),
    taxCode,
    earningsAtLEL: roundToTwoDecimals(ni.earningsAtLEL),
    earningsLELtoPT: roundToTwoDecimals(ni.earningsLELtoPT),
    earningsPTtoUEL: roundToTwoDecimals(ni.earningsPTtoUEL),
    earningsAboveUEL: roundToTwoDecimals(ni.earningsAboveUEL),
    earningsAboveST: roundToTwoDecimals(ni.earningsAboveST),
    nhsPensionEmployeeContribution: roundToTwoDecimals(pensions.nhsPensionEmployeeContribution),
    nhsPensionEmployerContribution: roundToTwoDecimals(pensions.nhsPensionEmployerContribution),
    nhsPensionTier: pensions.nhsPensionTier,
    nhsPensionEmployeeRate: pensions.nhsPensionEmployeeRate,
    nhsPensionEmployerRate: pensions.nhsPensionEmployerRate,
    isNHSPensionMember,
  };
}

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

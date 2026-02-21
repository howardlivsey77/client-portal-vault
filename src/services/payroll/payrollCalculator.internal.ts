/**
 * Internal phase functions for payroll calculation pipeline.
 *
 * Extracted from payrollCalculator.ts so they can be unit-tested
 * without changing the public API. Do NOT import this file from
 * outside the payroll service — use payrollCalculator.ts instead.
 */

import { roundToTwoDecimals } from "@/lib/formatters";
import { calculateMonthlyIncomeTaxAsync } from "./calculations/income-tax";
import { NICalculationResult } from "./calculations/national-insurance";
import { NationalInsuranceCalculator } from "./calculations/ni/services/NationalInsuranceCalculator";
import { PayrollDetails, PayrollResult } from "./types";
import { payrollLogger } from "./utils/payrollLogger";
import { roundDownToNearestPound } from "./utils/roundingUtils";
import { PayrollCalculationError } from "./errors/PayrollCalculationError";

// ---------------------------------------------------------------------------
// Inter-phase result types
// ---------------------------------------------------------------------------

export interface EarningsResult {
  grossPay: number;
  totalAdditionalEarnings: number;
}

export interface TaxResult {
  incomeTax: number;
  freePay: number;
  taxablePay: number;
}

export interface NIResult {
  nationalInsurance: number;
  employerNationalInsurance: number;
  earningsAtLEL: number;
  earningsLELtoPT: number;
  earningsPTtoUEL: number;
  earningsAboveUEL: number;
  earningsAboveST: number;
}

export interface PensionResult {
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

export function calculateEarnings(
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

export async function calculateTaxDeductions(
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

export async function calculateNIContributions(
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
// Phase 5 — Result assembly (all rounding lives here)
// ---------------------------------------------------------------------------

export function assemblePayrollResult(
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

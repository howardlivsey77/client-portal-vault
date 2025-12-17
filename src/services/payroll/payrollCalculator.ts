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

/**
 * Main function to calculate monthly payroll
 * 
 * @param details Payroll details including employee info, salary, tax code, etc.
 * @returns Calculated payroll result
 * @throws PayrollCalculationError with specific error codes for different failure types
 */
export async function calculateMonthlyPayroll(details: PayrollDetails): Promise<PayrollResult> {
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
    previousYearPensionablePay = null,
    taxYear: providedTaxYear
  } = details;
  
  // Use provided tax year or calculate current one
  const taxYear = providedTaxYear || getCurrentTaxYear();
  
  // Log states and flags only - no monetary amounts (data minimization)
  payrollLogger.debug('Starting payroll calculation', { 
    employeeId, 
    taxYear,
    hasNHSPension: isNHSPensionMember,
    hasAdditionalEarnings: additionalEarnings.length > 0,
    hasStudentLoan: studentLoanPlan !== null,
    studentLoanPlan,
    hasPension: pensionPercentage > 0
  });
  
  // Calculate earnings
  const totalAdditionalEarnings = additionalEarnings?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const grossPay = monthlySalary + totalAdditionalEarnings;
  
  payrollLogger.calculation('Gross pay', { 
    monthlySalary, 
    additionalEarnings: totalAdditionalEarnings, 
    grossPay 
  });
  
  // Calculate income tax with structured error handling
  let incomeTaxResult;
  try {
    incomeTaxResult = await calculateMonthlyIncomeTaxAsync(grossPay, taxCode, taxYear);
  } catch (err) {
    payrollLogger.error('Income tax calculation failed', err, 'TAX_CALC');
    throw new PayrollCalculationError(
      'INCOME_TAX_FAILED',
      'Failed to calculate income tax',
      err instanceof Error ? err : undefined,
      { taxCode, taxYear, employeeId }
    );
  }
  
  const incomeTax = incomeTaxResult.monthlyTax;
  const freePay = incomeTaxResult.freePay;
  
  payrollLogger.calculation('Income tax', { incomeTax, freePay });
  
  // Calculate taxable pay and round down to the nearest pound (HMRC requirement)
  const taxablePay = roundDownToNearestPound(grossPay - freePay);
  
  payrollLogger.calculation('Taxable pay', { grossPay, freePay, taxablePay });
  
  // Calculate National Insurance with structured error handling
  let niResult: NICalculationResult;
  try {
    const niCalculator = new NationalInsuranceCalculator(taxYear, false);
    niResult = await niCalculator.calculate(grossPay);
  } catch (err) {
    payrollLogger.error('NI calculation failed', err, 'NI_CALC');
    throw new PayrollCalculationError(
      'NI_CALCULATION_FAILED',
      'Failed to calculate National Insurance',
      err instanceof Error ? err : undefined,
      { taxYear, employeeId }
    );
  }
  
  const nationalInsurance = niResult.nationalInsurance;
  const employerNationalInsurance = niResult.employerNationalInsurance;
  
  // Get earnings in each NI band
  const earningsAtLEL = niResult.earningsAtLEL;
  const earningsLELtoPT = niResult.earningsLELtoPT;
  const earningsPTtoUEL = niResult.earningsPTtoUEL;
  const earningsAboveUEL = niResult.earningsAboveUEL;
  const earningsAboveST = niResult.earningsAboveST;
  
  payrollLogger.calculation('NI bands', {
    earningsAtLEL,
    earningsLELtoPT,
    earningsPTtoUEL,
    earningsAboveUEL,
    earningsAboveST,
    nationalInsurance,
    employerNationalInsurance
  }, 'NI_CALC');
  
  // Calculate student loan on base monthly salary only, not gross pay
  // Per SLC/HMRC guidance: student loan deductions are calculated on regular earnings only
  // Reference: https://www.gov.uk/guidance/paye-collection-of-student-loans
  const studentLoan = calculateStudentLoan(monthlySalary, studentLoanPlan);
  const pensionContribution = calculatePension(grossPay, pensionPercentage);
  
  payrollLogger.calculation('Student loan & pension', { studentLoan, pensionContribution });
  
  // Calculate NHS pension contributions with structured error handling
  let nhsPensionResult;
  try {
    nhsPensionResult = await calculateNHSPension(
      monthlySalary, 
      previousYearPensionablePay, 
      taxYear, 
      isNHSPensionMember
    );
  } catch (err) {
    payrollLogger.error('NHS pension calculation failed', err, 'PENSION');
    throw new PayrollCalculationError(
      'NHS_PENSION_FAILED',
      'Failed to calculate NHS pension contributions',
      err instanceof Error ? err : undefined,
      { taxYear, employeeId, isNHSPensionMember }
    );
  }
  
  payrollLogger.calculation('NHS pension', {
    employeeContribution: nhsPensionResult.employeeContribution,
    employerContribution: nhsPensionResult.employerContribution,
    tier: nhsPensionResult.tier
  }, 'PENSION');
  
  // Calculate totals
  const totalAdditionalDeductions = additionalDeductions.reduce((sum, item) => sum + item.amount, 0);
  const totalAdditionalAllowances = additionalAllowances.reduce((sum, item) => sum + item.amount, 0);
  
  const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution + nhsPensionResult.employeeContribution + totalAdditionalDeductions;
  const totalAllowances = totalAdditionalAllowances;
  const netPay = grossPay - totalDeductions + totalAllowances;
  
  payrollLogger.calculation('Final totals', { 
    totalDeductions, 
    totalAllowances, 
    netPay 
  });
  
  const result = {
    employeeId,
    employeeName,
    payrollId,
    monthlySalary,
    grossPay: roundToTwoDecimals(grossPay),
    taxablePay: roundToTwoDecimals(taxablePay),
    incomeTax: roundToTwoDecimals(incomeTax),
    nationalInsurance: roundToTwoDecimals(nationalInsurance),
    employerNationalInsurance: roundToTwoDecimals(employerNationalInsurance),
    studentLoan: roundToTwoDecimals(studentLoan),
    studentLoanPlan,
    pensionContribution: roundToTwoDecimals(pensionContribution),
    pensionPercentage,
    additionalDeductions,
    additionalAllowances,
    additionalEarnings,
    totalDeductions: roundToTwoDecimals(totalDeductions),
    totalAllowances: roundToTwoDecimals(totalAllowances),
    netPay: roundToTwoDecimals(netPay),
    freePay: roundToTwoDecimals(freePay),
    taxCode: taxCode,
    // Add the NI earnings bands to the result
    earningsAtLEL: roundToTwoDecimals(earningsAtLEL),
    earningsLELtoPT: roundToTwoDecimals(earningsLELtoPT),
    earningsPTtoUEL: roundToTwoDecimals(earningsPTtoUEL),
    earningsAboveUEL: roundToTwoDecimals(earningsAboveUEL),
    earningsAboveST: roundToTwoDecimals(earningsAboveST),
    // Add NHS pension fields to the result
    nhsPensionEmployeeContribution: roundToTwoDecimals(nhsPensionResult.employeeContribution),
    nhsPensionEmployerContribution: roundToTwoDecimals(nhsPensionResult.employerContribution),
    nhsPensionTier: nhsPensionResult.tier,
    nhsPensionEmployeeRate: nhsPensionResult.employeeRate,
    nhsPensionEmployerRate: nhsPensionResult.employerRate,
    isNHSPensionMember
  };
  
  // Log completion with identifiers only - no monetary amounts
  payrollLogger.debug('Payroll calculation complete', { 
    employeeId,
    taxYear,
    calculationSuccess: true
  });
  
  return result;
}

// Re-export all the functions we need for backward compatibility
export * from "./calculations/income-tax";
export * from "./calculations/national-insurance";
export * from "./calculations/student-loan";
export * from "./calculations/pension";
export * from "./calculations/nhs-pension";
export * from "./utils/tax-code-utils";
export * from "./constants/tax-constants";
export * from "./types";

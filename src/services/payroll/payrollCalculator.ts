
import { roundToTwoDecimals } from "@/lib/formatters";
import { calculateMonthlyIncomeTaxAsync } from "./calculations/income-tax";
import { calculateNationalInsurance, calculateNationalInsuranceAsync, NICalculationResult } from "./calculations/national-insurance";
import { calculateStudentLoan } from "./calculations/student-loan";
import { calculatePension } from "./calculations/pension";
import { calculateNHSPension } from "./calculations/nhs-pension";
import { PayrollDetails, PayrollResult } from "./types";
import { parseTaxCode } from "./utils/tax-code-utils";
import { NationalInsuranceCalculator } from "./calculations/ni/services/NationalInsuranceCalculator";
import { payrollLogger } from "./utils/payrollLogger";
import { getCurrentTaxYear } from "./utils/taxYearUtils";
import { roundDownToNearestPound } from "./utils/roundingUtils";

/**
 * Main function to calculate monthly payroll
 * 
 * @param details Payroll details including employee info, salary, tax code, etc.
 * @returns Calculated payroll result
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
  
  payrollLogger.debug('Starting payroll calculation', { 
    employeeId, 
    monthlySalary, 
    taxYear,
    isNHSPensionMember 
  });
  
  // Calculate earnings
  const totalAdditionalEarnings = additionalEarnings?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const grossPay = monthlySalary + totalAdditionalEarnings;
  
  payrollLogger.calculation('Gross pay', { 
    monthlySalary, 
    additionalEarnings: totalAdditionalEarnings, 
    grossPay 
  });
  
  // Calculate deductions using enhanced async tax calculation from database
  const incomeTaxResult = await calculateMonthlyIncomeTaxAsync(grossPay, taxCode, taxYear);
  const incomeTax = incomeTaxResult.monthlyTax;
  const freePay = incomeTaxResult.freePay;
  
  payrollLogger.calculation('Income tax', { incomeTax, freePay });
  
  // Calculate taxable pay and round down to the nearest pound (HMRC requirement)
  const taxablePay = roundDownToNearestPound(grossPay - freePay);
  
  payrollLogger.calculation('Taxable pay', { grossPay, freePay, taxablePay });
  
  // Use the NI calculator service for National Insurance calculations
  const niCalculator = new NationalInsuranceCalculator(taxYear, false);
  const niResult: NICalculationResult = await niCalculator.calculate(grossPay);
  const nationalInsurance = niResult.nationalInsurance;
  
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
    nationalInsurance
  }, 'NI_CALC');
  
  // Calculate student loan on base monthly salary only, not gross pay
  // Student loan deductions should only be based on regular salary, excluding additional earnings
  const studentLoan = calculateStudentLoan(monthlySalary, studentLoanPlan);
  const pensionContribution = calculatePension(grossPay, pensionPercentage);
  
  payrollLogger.calculation('Student loan & pension', { studentLoan, pensionContribution });
  
  // Calculate NHS pension contributions
  const nhsPensionResult = await calculateNHSPension(
    monthlySalary, 
    previousYearPensionablePay, 
    taxYear, 
    isNHSPensionMember
  );
  
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
  
  payrollLogger.debug('Payroll calculation complete', { employeeId, netPay: result.netPay });
  
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

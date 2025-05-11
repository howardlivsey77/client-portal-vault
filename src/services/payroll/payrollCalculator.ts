import { roundToTwoDecimals } from "@/lib/formatters";
import { calculateMonthlyIncomeTaxAsync } from "./calculations/income-tax";
import { calculateNationalInsurance, calculateNationalInsuranceAsync, NICalculationResult } from "./calculations/national-insurance";
import { calculateStudentLoan } from "./calculations/student-loan";
import { calculatePension } from "./calculations/pension";
import { PayrollDetails, PayrollResult } from "./types";
import { parseTaxCode } from "./utils/tax-code-utils";
import { NationalInsuranceCalculator } from "./calculations/ni/services/NationalInsuranceCalculator";

/**
 * Round down to nearest pound for taxable pay
 */
function roundDownToNearestPound(amount: number): number {
  return Math.floor(amount);
}

/**
 * Main function to calculate monthly payroll
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
    additionalEarnings = []
  } = details;
  
  console.log(`[PAYROLL] Starting calculation for ${employeeName}, monthly salary: £${monthlySalary}`);
  
  // Tax year in format YYYY/YY
  const currentYear = new Date().getFullYear();
  const taxYear = `${currentYear}/${(currentYear + 1).toString().substring(2)}`;
  
  // Calculate earnings
  const totalAdditionalEarnings = additionalEarnings?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const grossPay = monthlySalary + totalAdditionalEarnings;
  console.log(`[PAYROLL] Gross pay: £${grossPay} (Salary: £${monthlySalary} + Additional: £${totalAdditionalEarnings})`);
  
  // Calculate deductions using enhanced async tax calculation from database
  const incomeTaxResult = await calculateMonthlyIncomeTaxAsync(grossPay, taxCode, taxYear);
  const incomeTax = incomeTaxResult.monthlyTax;
  const freePay = incomeTaxResult.freePay;
  console.log(`[PAYROLL] Income tax: £${incomeTax}, Free pay: £${freePay}`);
  
  // Calculate taxable pay and round down to the nearest pound
  const taxablePay = roundDownToNearestPound(grossPay - freePay);
  console.log(`[PAYROLL] Original calculation - Gross pay: £${grossPay}, Free pay: £${freePay}, Taxable pay (rounded down): £${taxablePay}`);
  
  // Special case for debugging Holly King
  const isHollyKing = employeeName.includes("Holly King");
  if (isHollyKing) {
    console.log(`[PAYROLL] HOLLY KING TEST CASE - Monthly salary: £${monthlySalary}, Gross pay: £${grossPay}`);
  }
  
  // Use the NI calculator service for National Insurance calculations
  console.log(`[PAYROLL] Calculating National Insurance for gross pay: £${grossPay}`);
  const niCalculator = new NationalInsuranceCalculator(taxYear, true);
  const niResult: NICalculationResult = await niCalculator.calculate(grossPay);
  const nationalInsurance = niResult.nationalInsurance;
  
  // Get earnings in each NI band
  const earningsAtLEL = niResult.earningsAtLEL;
  const earningsLELtoPT = niResult.earningsLELtoPT;
  const earningsPTtoUEL = niResult.earningsPTtoUEL;
  const earningsAboveUEL = niResult.earningsAboveUEL;
  const earningsAboveST = niResult.earningsAboveST;
  
  console.log(`[PAYROLL] NI calculation results:
    - Earnings at LEL: £${earningsAtLEL}
    - Earnings LEL to PT: £${earningsLELtoPT}
    - Earnings PT to UEL: £${earningsPTtoUEL}
    - Earnings above UEL: £${earningsAboveUEL}
    - Earnings above ST: £${earningsAboveST}
    - Total NI contribution: £${nationalInsurance}
  `);
  
  const studentLoan = calculateStudentLoan(grossPay, studentLoanPlan);
  const pensionContribution = calculatePension(grossPay, pensionPercentage);
  console.log(`[PAYROLL] Student loan: £${studentLoan}, Pension contribution: £${pensionContribution}`);
  
  // Calculate totals
  const totalAdditionalDeductions = additionalDeductions.reduce((sum, item) => sum + item.amount, 0);
  const totalAdditionalAllowances = additionalAllowances.reduce((sum, item) => sum + item.amount, 0);
  
  const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution + totalAdditionalDeductions;
  const totalAllowances = totalAdditionalAllowances;
  const netPay = grossPay - totalDeductions + totalAllowances;
  
  console.log(`[PAYROLL] Initial calculation results - Income tax: £${incomeTax}, Taxable pay: £${taxablePay}, NI: £${nationalInsurance}`);
  console.log(`[PAYROLL] NI earnings bands - LEL: £${earningsAtLEL}, LEL to PT: £${earningsLELtoPT}, PT to UEL: £${earningsPTtoUEL}, Above UEL: £${earningsAboveUEL}, Above ST: £${earningsAboveST}`);
  console.log(`[PAYROLL] Final net pay: £${netPay}`);
  
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
    earningsAboveST: roundToTwoDecimals(earningsAboveST)
  };
  
  console.log(`[PAYROLL] Final calculation result:`, result);
  return result;
}

// Re-export all the functions we need for backward compatibility
export * from "./calculations/income-tax";
export * from "./calculations/national-insurance";
export * from "./calculations/student-loan";
export * from "./calculations/pension";
export * from "./utils/tax-code-utils";
export * from "./constants/tax-constants";
export * from "./types";

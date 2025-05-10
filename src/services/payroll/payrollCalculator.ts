
import { roundToTwoDecimals } from "@/lib/formatters";
import { calculateMonthlyIncomeTaxAsync } from "./calculations/income-tax";
import { calculateNationalInsurance } from "./calculations/national-insurance";
import { calculateStudentLoan } from "./calculations/student-loan";
import { calculatePension } from "./calculations/pension";
import { PayrollDetails, PayrollResult } from "./types";
import { parseTaxCode } from "./utils/tax-code-utils";

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
  
  // Tax year in format YYYY/YY
  const currentYear = new Date().getFullYear();
  const taxYear = `${currentYear}/${(currentYear + 1).toString().substring(2)}`;
  
  // Calculate earnings
  const totalAdditionalEarnings = additionalEarnings?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const grossPay = monthlySalary + totalAdditionalEarnings;
  
  // Calculate deductions using enhanced async tax calculation from database
  const incomeTaxResult = await calculateMonthlyIncomeTaxAsync(grossPay, taxCode, taxYear);
  const incomeTax = incomeTaxResult.monthlyTax;
  const freePay = incomeTaxResult.freePay;
  
  // Calculate taxable pay and round down to the nearest pound
  const taxablePay = roundDownToNearestPound(grossPay - freePay);
  console.log(`Original calculation - Gross pay: ${grossPay}, Free pay: ${freePay}, Taxable pay (rounded down): ${taxablePay}`);
  
  const nationalInsurance = calculateNationalInsurance(grossPay);
  const studentLoan = calculateStudentLoan(grossPay, studentLoanPlan);
  const pensionContribution = calculatePension(grossPay, pensionPercentage);
  
  // Calculate totals
  const totalAdditionalDeductions = additionalDeductions.reduce((sum, item) => sum + item.amount, 0);
  const totalAdditionalAllowances = additionalAllowances.reduce((sum, item) => sum + item.amount, 0);
  
  const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution + totalAdditionalDeductions;
  const totalAllowances = totalAdditionalAllowances;
  const netPay = grossPay - totalDeductions + totalAllowances;
  
  console.log(`Initial calculation results - Income tax: ${incomeTax}, Taxable pay: ${taxablePay}, NI: ${nationalInsurance}`);
  
  return {
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
    taxCode: taxCode
  };
}

// Re-export all the functions we need for backward compatibility
export * from "./calculations/income-tax";
export * from "./calculations/national-insurance";
export * from "./calculations/student-loan";
export * from "./calculations/pension";
export * from "./utils/tax-code-utils";
export * from "./constants/tax-constants";
export * from "./types";


import { roundToTwoDecimals } from "@/lib/formatters";
import { calculateMonthlyIncomeTax } from "./calculations/income-tax";
import { calculateNationalInsurance } from "./calculations/national-insurance";
import { calculateStudentLoan } from "./calculations/student-loan";
import { calculatePension } from "./calculations/pension";
import { PayrollDetails, PayrollResult } from "./types";

/**
 * Main function to calculate monthly payroll
 */
export function calculateMonthlyPayroll(details: PayrollDetails): PayrollResult {
  const {
    employeeId,
    employeeName,
    payrollId,
    monthlySalary,
    taxCode,
    pensionPercentage = 0,
    studentLoanPlan = null,
    additionalDeductions = [],
    additionalAllowances = []
  } = details;
  
  // Calculate deductions
  const incomeTax = calculateMonthlyIncomeTax(monthlySalary, taxCode);
  const nationalInsurance = calculateNationalInsurance(monthlySalary);
  const studentLoan = calculateStudentLoan(monthlySalary, studentLoanPlan);
  const pensionContribution = calculatePension(monthlySalary, pensionPercentage);
  
  // Calculate totals
  const totalAdditionalDeductions = additionalDeductions.reduce((sum, item) => sum + item.amount, 0);
  const totalAdditionalAllowances = additionalAllowances.reduce((sum, item) => sum + item.amount, 0);
  
  const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution + totalAdditionalDeductions;
  const totalAllowances = totalAdditionalAllowances;
  const netPay = monthlySalary - totalDeductions + totalAllowances;
  
  return {
    employeeId,
    employeeName,
    payrollId,
    grossPay: roundToTwoDecimals(monthlySalary),
    incomeTax: roundToTwoDecimals(incomeTax),
    nationalInsurance: roundToTwoDecimals(nationalInsurance),
    studentLoan: roundToTwoDecimals(studentLoan),
    pensionContribution: roundToTwoDecimals(pensionContribution),
    additionalDeductions,
    additionalAllowances,
    totalDeductions: roundToTwoDecimals(totalDeductions),
    totalAllowances: roundToTwoDecimals(totalAllowances),
    netPay: roundToTwoDecimals(netPay)
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

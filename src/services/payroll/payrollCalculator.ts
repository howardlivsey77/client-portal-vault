
import { roundToTwoDecimals } from "@/lib/formatters";
import { 
  calculateIncomeTaxSync, 
  calculateMonthlyIncomeTaxSync 
} from "./calculations/income-tax";
import { 
  calculateNationalInsuranceSync 
} from "./calculations/national-insurance";
import { 
  calculateStudentLoanSync 
} from "./calculations/student-loan";
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
    taxRegion = 'UK',
    pensionPercentage = 0,
    studentLoanPlan = null,
    additionalDeductions = [],
    additionalAllowances = [],
    additionalEarnings = [],
    nicCode = 'A'  // Default to category A if not specified
  } = details;
  
  // Calculate earnings
  const totalAdditionalEarnings = additionalEarnings?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const grossPay = monthlySalary + totalAdditionalEarnings;
  
  // Calculate deductions
  const incomeTax = calculateMonthlyIncomeTaxSync(grossPay, taxCode, taxRegion);
  const nationalInsurance = calculateNationalInsuranceSync(grossPay);
  const studentLoan = calculateStudentLoanSync(grossPay, studentLoanPlan);
  const pensionContribution = calculatePension(grossPay, pensionPercentage);
  
  // Calculate totals
  const totalAdditionalDeductions = additionalDeductions.reduce((sum, item) => sum + item.amount, 0);
  const totalAdditionalAllowances = additionalAllowances.reduce((sum, item) => sum + item.amount, 0);
  
  const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution + totalAdditionalDeductions;
  const totalAllowances = totalAdditionalAllowances;
  const netPay = grossPay - totalDeductions + totalAllowances;
  
  return {
    employeeId,
    employeeName,
    payrollId,
    monthlySalary,
    taxCode,
    taxRegion,
    grossPay: roundToTwoDecimals(grossPay),
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
    nicCode
  };
}

// Re-export all the functions we need for backward compatibility
export * from "./calculations/income-tax";
export * from "./calculations/national-insurance";
export * from "./calculations/student-loan";
export * from "./calculations/pension";
export * from "./utils/tax-code-utils";
export * from "./utils/tax-constants-service";
export * from "./types";

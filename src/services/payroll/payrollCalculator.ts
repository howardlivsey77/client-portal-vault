
import { calculateNationalInsurance } from "./calculations/national-insurance";
import { calculatePension } from "./calculations/pension";
import { calculateStudentLoan } from "./calculations/student-loan";
import { calculateMonthlyIncomeTax } from "./calculations/income-tax-sync";
import { parseTaxCode } from "./utils/tax-code-utils";
import { getEmployeeYTDData } from "./utils/payroll-data-service";
import { PayrollResult } from "./types";

/**
 * Calculate monthly payroll based on input values
 * @param input PayrollFormValues from the calculator form
 * @returns PayrollResult with all calculated values
 */
export async function calculateMonthlyPayroll(input: any): Promise<PayrollResult> {
  try {
    const {
      employeeId,
      employeeName,
      payrollId,
      monthlySalary,
      taxCode,
      taxRegion,
      pensionPercentage,
      studentLoanPlan,
      nicCode,
      taxYear,
      taxPeriod,
      useEmergencyTax,
      isNewEmployee,
      additionalEarnings = [],
      additionalDeductions = [],
      additionalAllowances = []
    } = input;
    
    // Get tax-free allowance based on tax code
    const { allowance, monthlyAllowance } = parseTaxCode(taxCode);
    
    // Apply Week1/Month1 basis if specified (emergency tax)
    const actualTaxCode = useEmergencyTax ? `${taxCode} M1` : taxCode;
    
    // Calculate total gross earnings
    const additionalEarningsAmount = additionalEarnings.reduce((sum, item) => sum + item.amount, 0);
    const grossPay = monthlySalary + additionalEarningsAmount;
    
    // Calculate pension contribution
    const pensionContribution = calculatePension(grossPay, pensionPercentage);
    
    // Calculate taxable pay (gross minus pension contribution)
    const taxablePay = grossPay - pensionContribution;

    // Calculate income tax
    // Using the actual tax code (with M1 if emergency basis)
    const incomeTax = calculateMonthlyIncomeTax(
      taxablePay, 
      actualTaxCode, 
      taxRegion
    );
    
    // Calculate National Insurance
    const nationalInsurance = calculateNationalInsurance(
      grossPay, 
      nicCode || 'A', 
      taxYear
    );
    
    // Calculate student loan repayment
    const studentLoan = calculateStudentLoan(
      grossPay, 
      studentLoanPlan
    );

    // Calculate additional deductions
    const additionalDeductionsAmount = additionalDeductions.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate additional allowances
    const additionalAllowancesAmount = additionalAllowances.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate total deductions
    const totalDeductions = incomeTax + nationalInsurance + studentLoan + 
      additionalDeductionsAmount - additionalAllowancesAmount;
    
    // Calculate net pay
    const netPay = grossPay - totalDeductions;
    
    // Look up YTD data if not a new employee
    const ytdData = isNewEmployee ? null : await getEmployeeYTDData(employeeId, taxYear);
    
    // Prepare the result
    const result: PayrollResult = {
      employeeId,
      employeeName,
      payrollId,
      monthlySalary,
      grossPay,
      taxCode: actualTaxCode,
      taxRegion,
      taxYear,
      taxPeriod: taxPeriod || 1,
      taxablePay,
      taxFreeAmount: monthlyAllowance, // Using the HMRC-compliant monthly allowance
      incomeTax,
      nationalInsurance,
      nicCode: nicCode || 'A',
      studentLoan,
      studentLoanPlan,
      pensionContribution,
      pensionPercentage,
      totalDeductions,
      netPay,
      additionalEarnings,
      additionalDeductions,
      additionalAllowances,
      totalAllowances: additionalAllowancesAmount,
      
      // YTD data if available
      grossPayYTD: ytdData?.grossPayYTD || grossPay,
      taxablePayYTD: ytdData?.taxablePayYTD || taxablePay,
      incomeTaxYTD: ytdData?.incomeTaxYTD || incomeTax,
      nationalInsuranceYTD: ytdData?.nationalInsuranceYTD || nationalInsurance,
      studentLoanYTD: ytdData?.studentLoanYTD || studentLoan,
    };
    
    return result;
  } catch (error) {
    console.error("Error calculating payroll:", error);
    throw new Error(`Failed to calculate payroll: ${error instanceof Error ? error.message : String(error)}`);
  }
}

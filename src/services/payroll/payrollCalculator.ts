
import { roundToTwoDecimals } from "@/lib/formatters";
import { PayrollDetails, PayrollResult, PreviousPeriodData } from "./types";
import { calculateNationalInsurance } from "./calculations/national-insurance";
import { calculatePension } from "./calculations/pension";
import { calculateStudentLoan } from "./calculations/student-loan";
import { calculateMonthlyIncomeTaxSync } from "./calculations/income-tax-sync";
import { parseTaxCode } from "./utils/tax-code-utils";
import { getEmployeeYTDData } from "./utils/payroll-data-service";

/**
 * Calculate monthly payroll including tax, NI, and other deductions
 */
export async function calculateMonthlyPayroll(
  details: PayrollDetails
): Promise<PayrollResult> {
  try {
    // Set default values for missing fields
    const monthlySalary = details.monthlySalary || 0;
    const taxCode = details.taxCode || '1257L';
    const taxRegion = details.taxRegion || 'UK';
    const pensionPercentage = details.pensionPercentage || 0;
    const additionalEarnings = details.additionalEarnings || [];
    const additionalDeductions = details.additionalDeductions || [];
    const additionalAllowances = details.additionalAllowances || [];
    
    // Calculate gross pay (salary + additional earnings)
    const additionalEarningsTotal = additionalEarnings.reduce(
      (sum, item) => sum + item.amount, 0
    );
    
    const grossPay = monthlySalary + additionalEarningsTotal;
    
    // Get YTD data if available
    let ytdData: PreviousPeriodData | null = null;
    try {
      if (details.employeeId) {
        ytdData = await getEmployeeYTDData(
          details.employeeId, 
          details.taxYear || '2025-2026'
        );
      }
    } catch (error) {
      console.error("Error getting YTD data:", error);
    }
    
    // Calculate tax
    const monthlyTax = calculateMonthlyIncomeTaxSync(
      grossPay,
      taxCode,
      taxRegion
    );
    
    // Calculate NI contributions
    const niContribution = calculateNationalInsurance(grossPay, details.nicCode);
    
    // Calculate pension contribution
    const pensionContribution = calculatePension(grossPay, pensionPercentage);
    
    // Calculate student loan repayment
    const studentLoanRepayment = calculateStudentLoan(
      grossPay, 
      details.studentLoanPlan
    );
    
    // Parse tax code to get tax-free allowance
    const { monthlyAllowance } = parseTaxCode(taxCode);
    const taxFreeAmount = monthlyAllowance;
    
    // Calculate taxable pay
    const taxablePay = Math.max(0, grossPay - taxFreeAmount);
    
    // Sum all additional deductions
    const additionalDeductionsTotal = additionalDeductions.reduce(
      (sum, item) => sum + item.amount, 0
    );
    
    // Sum all additional allowances 
    const totalAllowances = additionalAllowances.reduce(
      (sum, item) => sum + item.amount, 0
    );
    
    // Calculate total deductions
    const totalDeductions = monthlyTax + niContribution + 
      studentLoanRepayment + pensionContribution + additionalDeductionsTotal;
    
    // Calculate net pay
    const netPay = grossPay - totalDeductions;
    
    // Build YTD values
    const grossPayYTD = ytdData ? ytdData.grossPayYTD + grossPay : grossPay;
    const taxablePayYTD = ytdData ? ytdData.taxablePayYTD + taxablePay : taxablePay;
    const incomeTaxYTD = ytdData ? ytdData.incomeTaxYTD + monthlyTax : monthlyTax;
    const nationalInsuranceYTD = ytdData ? ytdData.nationalInsuranceYTD + niContribution : niContribution;
    
    return {
      employeeId: details.employeeId,
      employeeName: details.employeeName,
      payrollId: details.payrollId || '',
      monthlySalary,
      grossPay,
      taxCode,
      taxRegion,
      taxYear: details.taxYear || '2025-2026',
      taxPeriod: details.taxPeriod || 1,
      taxablePay,
      taxFreeAmount,
      incomeTax: monthlyTax,
      nationalInsurance: niContribution,
      nicCode: details.nicCode || 'A',
      studentLoan: studentLoanRepayment,
      studentLoanPlan: details.studentLoanPlan,
      pensionContribution,
      pensionPercentage,
      totalDeductions,
      netPay,
      additionalEarnings,
      additionalDeductions,
      additionalAllowances,
      totalAllowances,
      grossPayYTD,
      taxablePayYTD,
      incomeTaxYTD,
      nationalInsuranceYTD,
      studentLoanYTD: studentLoanRepayment // Just this period for now
    };
  } catch (error) {
    console.error("Error in calculateMonthlyPayroll:", error);
    throw error;
  }
}

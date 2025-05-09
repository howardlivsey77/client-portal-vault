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
import { getTaxYear, getTaxPeriod } from "@/utils/taxYearUtils";
import { getPreviousPeriodData } from "./ytdDataService";
import { parseTaxCode, calculateTaxFreeAmountForPeriod } from "./utils/tax-code-utils";

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
    taxRegion = 'UK',
    pensionPercentage = 0,
    studentLoanPlan = null,
    additionalDeductions = [],
    additionalAllowances = [],
    additionalEarnings = [],
    nicCode = 'A',  // Default to category A if not specified
    taxYear: providedTaxYear,
    taxPeriod: providedTaxPeriod,
    previousTaxablePay = 0,
    previousTax = 0,
    isNewEmployee = false,
    useEmergencyTax = false
  } = details;
  
  // Tax year and period determination
  const payrollDate = new Date();
  const taxYear = providedTaxYear || getTaxYear(payrollDate);
  const taxPeriod = providedTaxPeriod || getTaxPeriod(payrollDate);
  
  // If emergency tax (Week 1/Month 1) is enabled, we don't use previous periods' data
  const shouldUseYTD = !useEmergencyTax && !isNewEmployee;
  
  // Get previous period data for YTD calculations if we're not using emergency tax
  let previousPeriodData = {
    grossPayYTD: 0,
    taxablePayYTD: 0,
    incomeTaxYTD: 0,
    nationalInsuranceYTD: 0,
    lastPeriod: 0
  };
  
  if (shouldUseYTD) {
    try {
      previousPeriodData = await getPreviousPeriodData(employeeId, taxYear, taxPeriod - 1);
    } catch (error) {
      console.error('Error fetching previous period data:', error);
      // Continue with zero values if we can't fetch previous data
    }
  }
  
  // Calculate earnings
  const totalAdditionalEarnings = additionalEarnings?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const grossPay = monthlySalary + totalAdditionalEarnings;
  
  // Determine if we should use emergency tax basis (Week 1/Month 1)
  let effectiveTaxCode = taxCode;
  if (useEmergencyTax && !taxCode.includes('M1')) {
    effectiveTaxCode = `${taxCode} M1`;
  }
  
  // Parse tax code to get tax-free allowance
  const taxCodeInfo = parseTaxCode(taxCode);
  const isCumulative = !useEmergencyTax;
  
  // Calculate tax-free amount for this period
  const taxFreeAmount = calculateTaxFreeAmountForPeriod(taxCode, taxPeriod, isCumulative);
  
  // Calculate taxable pay (gross pay minus tax-free deductions like pension)
  const pensionContribution = calculatePension(grossPay, pensionPercentage);
  const taxablePay = grossPay - pensionContribution;
  
  // Calculate deductions
  const incomeTax = calculateMonthlyIncomeTaxSync(grossPay, effectiveTaxCode, taxRegion);
  const nationalInsurance = calculateNationalInsuranceSync(grossPay);
  const studentLoan = calculateStudentLoanSync(grossPay, studentLoanPlan);
  
  // Calculate totals
  const totalAdditionalDeductions = additionalDeductions.reduce((sum, item) => sum + item.amount, 0);
  const totalAdditionalAllowances = additionalAllowances.reduce((sum, item) => sum + item.amount, 0);
  
  const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution + totalAdditionalDeductions;
  const totalAllowances = totalAdditionalAllowances;
  const netPay = grossPay - totalDeductions + totalAllowances;
  
  // Calculate YTD values
  const grossPayYTD = previousPeriodData.grossPayYTD + grossPay;
  const taxablePayYTD = previousPeriodData.taxablePayYTD + taxablePay;
  const incomeTaxYTD = previousPeriodData.incomeTaxYTD + incomeTax;
  const nationalInsuranceYTD = previousPeriodData.nationalInsuranceYTD + nationalInsurance;
  
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
    nicCode,
    
    // New YTD and tax period fields
    taxYear,
    taxPeriod,
    taxablePay: roundToTwoDecimals(taxablePay),
    taxablePayYTD: roundToTwoDecimals(taxablePayYTD),
    incomeTaxYTD: roundToTwoDecimals(incomeTaxYTD),
    nationalInsuranceYTD: roundToTwoDecimals(nationalInsuranceYTD),
    grossPayYTD: roundToTwoDecimals(grossPayYTD)
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

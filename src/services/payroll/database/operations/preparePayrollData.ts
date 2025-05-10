
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { calculateYTDValues } from "./calculateYTDValues";

/**
 * Prepare payroll data for database storage
 */
export async function preparePayrollData(result: PayrollResult, payPeriod: PayPeriod) {
  try {
    if (!result.employeeId) {
      return { success: false, error: "Missing employee ID for saving payroll result" };
    }
    
    const payrollPeriodDate = new Date(payPeriod.year, payPeriod.month - 1, 1);
    const formattedPayrollPeriod = payrollPeriodDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Tax year in format YYYY/YY
    const taxYear = `${payPeriod.year}/${(payPeriod.year + 1).toString().substring(2)}`;
    const taxPeriod = payPeriod.periodNumber;
    
    console.log(`Processing payroll for tax year: ${taxYear}, period: ${taxPeriod}`);
    
    // Get YTD values
    const ytdResult = await calculateYTDValues(result, payPeriod, taxYear, taxPeriod);
    
    if (!ytdResult.success) {
      return { success: false, error: ytdResult.error };
    }
    
    const { 
      taxablePay,
      grossPayYTD, 
      taxablePayYTD, 
      incomeTaxThisPeriod, 
      incomeTaxYTD, 
      nicEmployeeYTD 
    } = ytdResult.data;
    
    console.log(`Prepared taxable pay (rounded down): ${taxablePay}`);
    console.log(`Income tax this period (from YTD calc): ${incomeTaxThisPeriod/100}`);
    
    // Data to save to the database
    const payrollData = {
      employee_id: result.employeeId,
      payroll_period: formattedPayrollPeriod,
      tax_year: taxYear,
      tax_period: taxPeriod,
      tax_code: result.taxCode,
      student_loan_plan: result.studentLoanPlan || null,
      
      // Financial values - convert to pence/pennies for storage
      gross_pay_this_period: Math.round(result.grossPay * 100),
      taxable_pay_this_period: Math.round(taxablePay * 100),
      free_pay_this_period: Math.round(result.freePay * 100),
      income_tax_this_period: incomeTaxThisPeriod,
      
      pay_liable_to_nic_this_period: Math.round(result.grossPay * 100),
      nic_employee_this_period: Math.round(result.nationalInsurance * 100),
      nic_employer_this_period: 0, // Default to 0, update if available
      nic_letter: 'A', // Default, update if available
      
      student_loan_this_period: Math.round(result.studentLoan * 100),
      employee_pension_this_period: Math.round(result.pensionContribution * 100),
      employer_pension_this_period: 0, // Default to 0, update if available
      
      // NI earnings bands - defaults
      earnings_at_lel_this_period: 0,
      earnings_lel_to_pt_this_period: 0,
      earnings_pt_to_uel_this_period: 0,
      earnings_above_st_this_period: 0,
      earnings_above_uel_this_period: 0,
      
      // Net pay calculation
      net_pay_this_period: Math.round(result.netPay * 100),
      
      // Year-to-date values
      gross_pay_ytd: grossPayYTD,
      taxable_pay_ytd: taxablePayYTD,
      income_tax_ytd: incomeTaxYTD,
      nic_employee_ytd: nicEmployeeYTD
    };
    
    return { 
      success: true, 
      payrollData, 
      taxYear, 
      taxPeriod,
      ytdData: ytdResult.data 
    };
  } catch (error) {
    console.error("Error preparing payroll data:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

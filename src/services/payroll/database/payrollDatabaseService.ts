
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { preparePayrollData } from "./operations/preparePayrollData";
import { savePayrollData } from "./operations/savePayrollData";
import { clearPayrollResults } from "./operations/clearPayrollResults";
import { roundToTwoDecimals } from "@/lib/formatters";

/**
 * Save payroll result to the database
 */
export async function savePayrollResultToDatabase(result: PayrollResult, payPeriod: PayPeriod) {
  try {
    // Prepare data for saving
    const prepResult = await preparePayrollData(result, payPeriod);
    
    if (!prepResult.success) {
      return { success: false, error: prepResult.error };
    }
    
    // Save the data
    const { payrollData, taxYear, taxPeriod, ytdData } = prepResult;
    const saveResult = await savePayrollData(payrollData, result.employeeId, taxYear, taxPeriod);
    
    if (saveResult.success) {
      // Convert database values back to a PayrollResult format
      // This ensures UI uses the exact same numbers that were saved to DB
      
      const updatedResult: PayrollResult = {
        ...result,
        // Use the values from the database calculation
        incomeTax: roundToTwoDecimals(payrollData.income_tax_this_period / 100),
        taxablePay: roundToTwoDecimals(payrollData.taxable_pay_this_period / 100),
        freePay: roundToTwoDecimals(payrollData.free_pay_this_period / 100),
        nationalInsurance: roundToTwoDecimals(payrollData.nic_employee_this_period / 100),
        studentLoan: roundToTwoDecimals(payrollData.student_loan_this_period / 100),
        pensionContribution: roundToTwoDecimals(payrollData.employee_pension_this_period / 100),
        
        // Add the NI earnings band fields to ensure they're returned to the UI
        earningsAtLEL: roundToTwoDecimals(payrollData.earnings_at_lel_this_period / 100),
        earningsLELtoPT: roundToTwoDecimals(payrollData.earnings_lel_to_pt_this_period / 100),
        earningsPTtoUEL: roundToTwoDecimals(payrollData.earnings_pt_to_uel_this_period / 100),
        earningsAboveUEL: roundToTwoDecimals(payrollData.earnings_above_uel_this_period / 100),
        earningsAboveST: roundToTwoDecimals(payrollData.earnings_above_st_this_period / 100),
        
        // These shouldn't change, but included for clarity
        grossPay: roundToTwoDecimals(payrollData.gross_pay_this_period / 100),
        netPay: roundToTwoDecimals(payrollData.net_pay_this_period / 100)
      };
      
      return { 
        success: true, 
        message: saveResult.message,
        updatedResult 
      };
    }
    
    return { success: false, error: saveResult.error || "Unknown error saving payroll data" };
  } catch (error) {
    console.error("Error saving payroll result:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Re-export clearPayrollResults to maintain the same API
export { clearPayrollResults } from "./operations/clearPayrollResults";

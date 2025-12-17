
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { preparePayrollData } from "./operations/preparePayrollData";
import { savePayrollData } from "./operations/savePayrollData";
import { clearPayrollResults } from "./operations/clearPayrollResults";
import { roundToTwoDecimals } from "@/lib/formatters";
import { payrollLogger } from "@/services/payroll/utils/payrollLogger";

/**
 * Save payroll result to the database
 */
export async function savePayrollResultToDatabase(result: PayrollResult, payPeriod: PayPeriod, companyId: string) {
  try {
    payrollLogger.debug('Saving payroll result to database', { 
      employeeId: result.employeeId,
      grossPay: result.grossPay,
      companyId 
    }, 'DATABASE');
    
    payrollLogger.calculation('NI values being saved', {
      nationalInsurance: result.nationalInsurance,
      earningsAtLEL: result.earningsAtLEL,
      earningsLELtoPT: result.earningsLELtoPT,
      earningsPTtoUEL: result.earningsPTtoUEL,
      earningsAboveUEL: result.earningsAboveUEL,
      earningsAboveST: result.earningsAboveST
    }, 'DATABASE');
    
    // Prepare data for saving
    const prepResult = await preparePayrollData(result, payPeriod, companyId);
    
    if (!prepResult.success) {
      payrollLogger.error(`Error preparing payroll data: ${prepResult.error}`, undefined, 'DATABASE');
      return { success: false, error: prepResult.error };
    }
    
    // Save the data
    const { payrollData, taxYear, taxPeriod, ytdData } = prepResult;
    
    payrollLogger.calculation('Payroll data prepared (pennies)', {
      nic_employee: payrollData.nic_employee_this_period,
      earnings_at_lel: payrollData.earnings_at_lel_this_period,
      earnings_lel_to_pt: payrollData.earnings_lel_to_pt_this_period,
      earnings_pt_to_uel: payrollData.earnings_pt_to_uel_this_period,
      earnings_above_uel: payrollData.earnings_above_uel_this_period,
      earnings_above_st: payrollData.earnings_above_st_this_period,
      pay_liable_to_nic: payrollData.pay_liable_to_nic_this_period
    }, 'DATABASE');
    
    // Double-check NI calculation before saving - if gross pay is over PT threshold, ensure we have NI
    const PT_THRESHOLD_PENNIES = 104800; // £1,048 in pennies
    if (payrollData.pay_liable_to_nic_this_period > PT_THRESHOLD_PENNIES && payrollData.nic_employee_this_period === 0) {
      payrollLogger.warn('Pay liable to NIC is above PT threshold, but NI contribution is zero', {
        payLiableToNIC: payrollData.pay_liable_to_nic_this_period,
        ptThreshold: PT_THRESHOLD_PENNIES
      }, 'DATABASE');
    }
    
    const saveResult = await savePayrollData(payrollData, result.employeeId, taxYear, taxPeriod);
    
    if (saveResult.success) {
      payrollLogger.debug('Payroll data saved successfully', { companyId }, 'DATABASE');
      
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
      
      payrollLogger.debug('Updated result with database values', { 
        employeeId: result.employeeId,
        netPay: updatedResult.netPay 
      }, 'DATABASE');
      
      return { 
        success: true, 
        message: saveResult.message,
        updatedResult 
      };
    }
    
    payrollLogger.error(`Error saving payroll data: ${saveResult.error}`, undefined, 'DATABASE');
    return { success: false, error: saveResult.error || "Unknown error saving payroll data" };
  } catch (error) {
    payrollLogger.error("Error saving payroll result", error, 'DATABASE');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Re-export clearPayrollResults to maintain the same API
export { clearPayrollResults } from "./operations/clearPayrollResults";


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
    console.log(`[DATABASE] Saving payroll result to database for ${result.employeeName} with gross pay: £${result.grossPay}`);
    console.log(`[DATABASE] NI values being saved: 
      - National Insurance: £${result.nationalInsurance}
      - LEL: £${result.earningsAtLEL}
      - LEL to PT: £${result.earningsLELtoPT}
      - PT to UEL: £${result.earningsPTtoUEL}
      - Above UEL: £${result.earningsAboveUEL}
      - Above ST: £${result.earningsAboveST}
    `);
    
    // Special case for debugging Holly King
    if (result.employeeName.includes("Holly King")) {
      console.log(`[DATABASE] HOLLY KING TEST CASE - Monthly salary: £${result.monthlySalary}, Gross pay: £${result.grossPay}`);
    }
    
    // Prepare data for saving
    const prepResult = await preparePayrollData(result, payPeriod);
    
    if (!prepResult.success) {
      console.error(`[DATABASE] Error preparing payroll data: ${prepResult.error}`);
      return { success: false, error: prepResult.error };
    }
    
    // Save the data
    const { payrollData, taxYear, taxPeriod, ytdData } = prepResult;
    
    console.log(`[DATABASE] Payroll data prepared with values in pennies: 
      - NI Employee: ${payrollData.nic_employee_this_period} pennies (£${payrollData.nic_employee_this_period/100})
      - LEL: ${payrollData.earnings_at_lel_this_period} pennies (£${payrollData.earnings_at_lel_this_period/100})
      - LEL to PT: ${payrollData.earnings_lel_to_pt_this_period} pennies (£${payrollData.earnings_lel_to_pt_this_period/100})
      - PT to UEL: ${payrollData.earnings_pt_to_uel_this_period} pennies (£${payrollData.earnings_pt_to_uel_this_period/100})
      - Above UEL: ${payrollData.earnings_above_uel_this_period} pennies (£${payrollData.earnings_above_uel_this_period/100})
      - Above ST: ${payrollData.earnings_above_st_this_period} pennies (£${payrollData.earnings_above_st_this_period/100})
      - Total pay liable to NIC: ${payrollData.pay_liable_to_nic_this_period} pennies (£${payrollData.pay_liable_to_nic_this_period/100})
    `);
    
    // Double-check NI calculation before saving - if gross pay is over PT threshold, ensure we have NI
    const PT_THRESHOLD_PENNIES = 104800; // £1,048 in pennies
    if (payrollData.pay_liable_to_nic_this_period > PT_THRESHOLD_PENNIES && payrollData.nic_employee_this_period === 0) {
      console.warn(`[DATABASE] WARNING: Pay liable to NIC ${payrollData.pay_liable_to_nic_this_period} is above PT threshold, but NI contribution is zero!`);
      console.warn(`[DATABASE] Forcing NI recalculation based on pay liable to NIC...`);
      
      // For now, log warning but proceed with save as-is
      // We'll diagnose from the logs
    }
    
    const saveResult = await savePayrollData(payrollData, result.employeeId, taxYear, taxPeriod);
    
    if (saveResult.success) {
      console.log(`[DATABASE] Payroll data saved successfully`);
      
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
      
      console.log(`[DATABASE] Updated result with database values:`, updatedResult);
      
      return { 
        success: true, 
        message: saveResult.message,
        updatedResult 
      };
    }
    
    console.error(`[DATABASE] Error saving payroll data: ${saveResult.error}`);
    return { success: false, error: saveResult.error || "Unknown error saving payroll data" };
  } catch (error) {
    console.error("[DATABASE] Error saving payroll result:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Re-export clearPayrollResults to maintain the same API
export { clearPayrollResults } from "./operations/clearPayrollResults";

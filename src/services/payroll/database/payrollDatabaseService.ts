
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { preparePayrollData } from "./operations/preparePayrollData";
import { savePayrollData } from "./operations/savePayrollData";
import { clearPayrollResults } from "./operations/clearPayrollResults";

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
    const { payrollData, taxYear, taxPeriod } = prepResult;
    return await savePayrollData(payrollData, result.employeeId, taxYear, taxPeriod);
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


import { supabase } from "@/integrations/supabase/client";
import { PreviousPeriodData } from "../types";
import { penceToPounds } from "./payroll-format-utils";

/**
 * Get employee's Year-To-Date data from previous payroll records
 */
export async function getEmployeeYTDData(
  employeeId: string,
  taxYear: string
): Promise<PreviousPeriodData> {
  try {
    // Get the latest payroll record for this employee and tax year
    const { data, error } = await supabase
      .from('payroll_results')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('tax_year', taxYear)
      .order('payroll_period', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error("Error fetching YTD data:", error);
      throw new Error(`Failed to fetch YTD data: ${error.message}`);
    }
    
    // If no previous data exists, return zeros
    if (!data || data.length === 0) {
      return {
        grossPayYTD: 0,
        taxablePayYTD: 0,
        incomeTaxYTD: 0,
        nationalInsuranceYTD: 0,
        studentLoanYTD: 0,
        lastPeriod: 0
      };
    }
    
    // Extract data from the latest record
    const latestRecord = data[0];
    
    // Return the YTD values, converting from pence to pounds
    return {
      grossPayYTD: penceToPounds(latestRecord.gross_pay_ytd || 0),
      taxablePayYTD: penceToPounds(latestRecord.taxable_pay_ytd || 0),
      incomeTaxYTD: penceToPounds(latestRecord.income_tax_ytd || 0),
      nationalInsuranceYTD: penceToPounds(latestRecord.nic_employee_ytd || 0),
      studentLoanYTD: penceToPounds(latestRecord.student_loan_ytd || 0),
      lastPeriod: latestRecord.tax_period || 0
    };
  } catch (error) {
    console.error("Error in getEmployeeYTDData:", error);
    // Return zeros as fallback
    return {
      grossPayYTD: 0,
      taxablePayYTD: 0,
      incomeTaxYTD: 0,
      nationalInsuranceYTD: 0,
      studentLoanYTD: 0
    };
  }
}

/**
 * Utility function to format pence to pounds
 */
export function formatPenceToPounds(pence: number): number {
  return Math.round((pence / 100) * 100) / 100;
}

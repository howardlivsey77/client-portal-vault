
import { supabase } from "@/integrations/supabase/client";
import { PreviousPeriodData } from "../types";

/**
 * Get YTD data for an employee
 * @param employeeId Employee ID
 * @param taxYear Current tax year (format: "YYYY-YYYY")
 * @returns Previous period data for calculations
 */
export async function getEmployeeYTDData(
  employeeId: string,
  taxYear: string
): Promise<PreviousPeriodData> {
  try {
    // Parse tax year to get date ranges
    const years = taxYear.split("-");
    if (years.length !== 2) {
      throw new Error(`Invalid tax year format: ${taxYear}`);
    }
    
    const startYear = parseInt(years[0], 10);
    // UK tax year runs from April 6 to April 5
    const startDate = new Date(startYear, 3, 6); // April 6th
    const endDate = new Date(startYear + 1, 3, 5); // April 5th next year
    
    // Format dates for database query
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    
    // Get all payroll results for this employee in the current tax year
    const { data, error } = await supabase
      .from("payroll_results")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("payroll_period", startDateStr)
      .lt("payroll_period", endDateStr)
      .order("payroll_period", { ascending: false });
    
    if (error) {
      console.error("Error fetching YTD data:", error);
      throw error;
    }
    
    // If no data found, return zeros
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
    
    // Add up all values from existing periods
    // Database stores monetary values in pence, so convert to pounds
    let grossPayYTD = 0;
    let taxablePayYTD = 0;
    let incomeTaxYTD = 0;
    let nationalInsuranceYTD = 0;
    let studentLoanYTD = 0;
    
    // Use the most recent record for YTD values if available
    if (data[0].gross_pay_ytd) {
      // YTD values are already stored, use them
      grossPayYTD = data[0].gross_pay_ytd / 100;
      taxablePayYTD = data[0].taxable_pay_ytd / 100;
      incomeTaxYTD = data[0].income_tax_ytd / 100;
      nationalInsuranceYTD = data[0].nic_employee_ytd / 100;
      studentLoanYTD = data[0].student_loan_this_period / 100; // Use current period as YTD not stored
    } else {
      // Sum up individual periods
      data.forEach((record) => {
        grossPayYTD += record.gross_pay_this_period / 100;
        taxablePayYTD += record.taxable_pay_this_period / 100;
        incomeTaxYTD += record.income_tax_this_period / 100;
        nationalInsuranceYTD += record.nic_employee_this_period / 100;
        studentLoanYTD += record.student_loan_this_period / 100;
      });
    }
    
    return {
      grossPayYTD,
      taxablePayYTD,
      incomeTaxYTD,
      nationalInsuranceYTD,
      studentLoanYTD,
      lastPeriod: data.length
    };
  } catch (error) {
    console.error("Error in getEmployeeYTDData:", error);
    // Return zeros if error
    return {
      grossPayYTD: 0,
      taxablePayYTD: 0,
      incomeTaxYTD: 0,
      nationalInsuranceYTD: 0,
      studentLoanYTD: 0,
      lastPeriod: 0
    };
  }
}

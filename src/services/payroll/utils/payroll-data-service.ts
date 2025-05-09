
import { supabase } from "@/integrations/supabase/client";
import { PreviousPeriodData } from "../types";

/**
 * Get employee year-to-date payroll data
 * @param employeeId Employee ID
 * @param taxYear Current tax year (e.g., "2024-2025")
 * @returns Year-to-date payroll data 
 */
export async function getEmployeeYTDData(
  employeeId: string, 
  taxYear: string
): Promise<PreviousPeriodData | null> {
  try {
    // Extract years from tax year string (e.g., "2025-2026")
    const years = taxYear.split('-');
    const startYear = parseInt(years[0], 10);
    const endYear = parseInt(years[1], 10);
    
    // Tax year ranges from April 6 of start year to April 5 of end year
    const startDate = new Date(startYear, 3, 6); // April 6th
    const endDate = new Date(new Date().getTime()); // Today's date
    
    // Get all payroll records for this employee in the tax year
    const { data, error } = await supabase
      .from('payroll_results')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('payroll_period', startDate.toISOString().split('T')[0])
      .lte('payroll_period', endDate.toISOString().split('T')[0])
      .order('payroll_period', { ascending: true });
      
    if (error) {
      console.error("Error fetching employee YTD data:", error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Calculate YTD totals (convert from pence to pounds)
    const ytdData: PreviousPeriodData = {
      grossPayYTD: data.reduce((sum, record) => sum + (record.gross_pay_this_period || 0), 0) / 100,
      taxablePayYTD: data.reduce((sum, record) => sum + (record.taxable_pay_this_period || 0), 0) / 100,
      incomeTaxYTD: data.reduce((sum, record) => sum + (record.income_tax_this_period || 0), 0) / 100,
      nationalInsuranceYTD: data.reduce((sum, record) => sum + (record.nic_employee_this_period || 0), 0) / 100,
      lastPeriod: data.length
    };
    
    return ytdData;
  } catch (error) {
    console.error("Error in getEmployeeYTDData:", error);
    return null;
  }
}


import { supabase } from "@/integrations/supabase/client";
import { PreviousPeriodData } from "./types";

/**
 * Fetch previous period data for YTD calculations
 * 
 * @param employeeId The ID of the employee
 * @param taxYear The tax year (e.g., "2025-2026")
 * @param periodNumber The period number to fetch up to (1-12)
 * @returns Previous period data for YTD calculations
 */
export async function getPreviousPeriodData(
  employeeId: string, 
  taxYear: string,
  periodNumber: number
): Promise<PreviousPeriodData> {
  // Tax year in the database is stored as a date range
  // Extract the start year from the tax year string
  const startYear = parseInt(taxYear.split('-')[0], 10);
  // April 6th of the start year
  const taxYearStart = new Date(startYear, 3, 6).toISOString().split('T')[0]; 
  // April 5th of the next year
  const taxYearEnd = new Date(startYear + 1, 3, 5).toISOString().split('T')[0];
  
  try {
    // Query the database for payroll results in the current tax year
    // up to the specified period
    const { data, error } = await supabase
      .from('payroll_results')
      .select(`
        gross_pay_this_period,
        taxable_pay_this_period,
        income_tax_this_period,
        nic_employee_this_period,
        payroll_period
      `)
      .eq('employee_id', employeeId)
      .gte('payroll_period', taxYearStart)
      .lte('payroll_period', taxYearEnd)
      .order('payroll_period', { ascending: true });
    
    if (error) {
      console.error("Error fetching previous payroll results:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      // No previous data found
      return {
        grossPayYTD: 0,
        taxablePayYTD: 0,
        incomeTaxYTD: 0,
        nationalInsuranceYTD: 0,
        lastPeriod: 0
      };
    }
    
    // Convert pence to pounds and sum up the values
    const results = {
      grossPayYTD: 0,
      taxablePayYTD: 0,
      incomeTaxYTD: 0,
      nationalInsuranceYTD: 0,
      lastPeriod: data.length
    };
    
    data.forEach(record => {
      results.grossPayYTD += record.gross_pay_this_period / 100;
      results.taxablePayYTD += record.taxable_pay_this_period / 100;
      results.incomeTaxYTD += record.income_tax_this_period / 100;
      results.nationalInsuranceYTD += record.nic_employee_this_period / 100;
    });
    
    return results;
  } catch (error) {
    console.error("Unexpected error in getPreviousPeriodData:", error);
    throw error;
  }
}

/**
 * Save YTD data when saving a payroll result
 * Updates the payroll_results table to include YTD information
 * 
 * @param employeeId Employee ID
 * @param payrollPeriod Date of payroll period
 * @param ytdData YTD data to save
 */
export async function saveYTDData(
  employeeId: string,
  payrollPeriod: string,
  ytdData: {
    grossPayYTD: number,
    taxablePayYTD: number,
    incomeTaxYTD: number,
    nationalInsuranceYTD: number,
    taxYear: string,
    taxPeriod: number
  }
): Promise<boolean> {
  try {
    // Convert to pence for database storage (database stores in pence)
    const updatedData = {
      gross_pay_ytd: Math.round(ytdData.grossPayYTD * 100),
      taxable_pay_ytd: Math.round(ytdData.taxablePayYTD * 100),
      income_tax_ytd: Math.round(ytdData.incomeTaxYTD * 100),
      nic_employee_ytd: Math.round(ytdData.nationalInsuranceYTD * 100),
      tax_year: ytdData.taxYear,
      tax_period: ytdData.taxPeriod
    };
    
    // Update the record in the database
    const { error } = await supabase
      .from('payroll_results')
      .update(updatedData)
      .eq('employee_id', employeeId)
      .eq('payroll_period', payrollPeriod);
      
    if (error) {
      console.error("Error saving YTD data:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Unexpected error in saveYTDData:", error);
    return false;
  }
}

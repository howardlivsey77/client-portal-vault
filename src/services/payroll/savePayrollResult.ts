import { supabase } from "@/integrations/supabase/client";
import { PayrollResult } from "./types";
import { roundToTwoDecimals } from "@/lib/formatters";
import { getTaxYear, getTaxPeriod } from "@/utils/taxYearUtils";
import { parseTaxCode } from "./utils/tax-code-utils";

/**
 * Convert pounds to pence for database storage
 */
function poundsToPence(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Save payroll calculation result to database
 */
export async function savePayrollResult(
  result: PayrollResult, 
  payrollPeriod: string
): Promise<{ success: boolean, message: string, id?: string }> {
  try {
    // Validate employee ID
    if (!result.employeeId) {
      return { success: false, message: "Missing employee ID" };
    }

    // Convert payroll period string to date
    const periodDate = new Date(payrollPeriod);
    if (isNaN(periodDate.getTime())) {
      return { success: false, message: "Invalid payroll period date" };
    }
    
    // Get tax year and period if not provided
    const taxYear = result.taxYear || getTaxYear(periodDate);
    const taxPeriod = result.taxPeriod || getTaxPeriod(periodDate);
    
    // Calculate free pay using HMRC method
    const taxCode = result.taxCode.replace(' M1', ''); // Remove M1 indicator if present
    const { monthlyAllowance } = parseTaxCode(taxCode);
    const freePay = monthlyAllowance;
    
    // Convert PayrollResult to database format (mainly converting pounds to pence)
    const payrollData = {
      employee_id: result.employeeId,
      payroll_period: periodDate.toISOString().split('T')[0], // YYYY-MM-DD format
      
      // Tax information
      tax_code: result.taxCode,
      tax_year: taxYear,
      tax_period: taxPeriod,
      free_pay_this_period: poundsToPence(freePay), // Use HMRC free pay calculation
      taxable_pay_this_period: poundsToPence(result.taxablePay || result.monthlySalary),
      income_tax_this_period: poundsToPence(result.incomeTax),
      
      // YTD information
      taxable_pay_ytd: poundsToPence(result.taxablePayYTD || result.taxablePay || result.monthlySalary),
      income_tax_ytd: poundsToPence(result.incomeTaxYTD || result.incomeTax),
      
      // NIC information
      nic_letter: result.nicCode || 'A',
      pay_liable_to_nic_this_period: poundsToPence(result.monthlySalary),
      nic_employee_this_period: poundsToPence(result.nationalInsurance),
      nic_employer_this_period: poundsToPence(result.nationalInsurance * 1.5), // Approximate employer NI
      nic_employee_ytd: poundsToPence(result.nationalInsuranceYTD || result.nationalInsurance),
      
      // NIC bands (these would ideally come from the NIC calculator)
      earnings_at_lel_this_period: 0,
      earnings_lel_to_pt_this_period: 0,
      earnings_pt_to_uel_this_period: poundsToPence(result.monthlySalary),
      earnings_above_uel_this_period: 0,
      earnings_above_st_this_period: 0,
      
      // Student loan - ensure it's a number type for the database
      student_loan_plan: result.studentLoanPlan,
      student_loan_this_period: poundsToPence(result.studentLoan),
      
      // Pension
      employee_pension_this_period: poundsToPence(result.pensionContribution),
      employer_pension_this_period: poundsToPence(result.pensionContribution * 0.5), // Approximate employer contribution
      
      // Totals
      gross_pay_this_period: poundsToPence(result.grossPay),
      gross_pay_ytd: poundsToPence(result.grossPayYTD || result.grossPay),
      net_pay_this_period: poundsToPence(result.netPay)
    };
    
    // Check if there's already a record for this employee and period
    const { data: existingRecords, error: fetchError } = await supabase
      .from('payroll_results')
      .select('id')
      .eq('employee_id', result.employeeId)
      .eq('payroll_period', periodDate.toISOString().split('T')[0])
      .eq('tax_year', taxYear);
      
    if (fetchError) {
      console.error("Error checking for existing payroll records:", fetchError);
      return { 
        success: false, 
        message: `Error checking for existing records: ${fetchError.message}` 
      };
    }
    
    // If there are existing records, update the most recent one instead of creating a new one
    if (existingRecords && existingRecords.length > 0) {
      const mostRecentId = existingRecords[0].id;
      
      const { error: updateError } = await supabase
        .from('payroll_results')
        .update(payrollData)
        .eq('id', mostRecentId);
        
      if (updateError) {
        console.error("Error updating payroll result:", updateError);
        return { 
          success: false, 
          message: `Error updating payroll result: ${updateError.message}` 
        };
      }
      
      return { 
        success: true, 
        message: "Payroll result updated successfully", 
        id: mostRecentId 
      };
    } else {
      // No existing record, insert a new one
      const { data, error } = await supabase
        .from('payroll_results')
        .insert(payrollData)
        .select('id')
        .single();
        
      if (error) {
        console.error("Error saving payroll result:", error);
        return { 
          success: false, 
          message: `Error saving payroll result: ${error.message}` 
        };
      }
      
      return { 
        success: true, 
        message: "Payroll result saved successfully", 
        id: data.id 
      };
    }
  } catch (error) {
    console.error("Unexpected error saving payroll result:", error);
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Fetch payroll results for an employee
 */
export async function fetchPayrollResults(
  employeeId: string,
  limit: number = 12
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('payroll_results')
      .select('*')
      .eq('employee_id', employeeId)
      .order('payroll_period', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error fetching payroll results:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching payroll results:", error);
    return [];
  }
}

/**
 * Fetch payroll results by tax year
 */
export async function fetchPayrollResultsByTaxYear(
  taxYear: string
): Promise<any[]> {
  try {
    // Extract years from tax year string (e.g., "2025-2026")
    const years = taxYear.split('-');
    const startYear = parseInt(years[0], 10);
    const endYear = parseInt(years[1], 10);
    
    // Tax year ranges from April 6 of start year to April 5 of end year
    const startDate = new Date(startYear, 3, 6); // April 6th
    const endDate = new Date(endYear, 3, 5); // April 5th
    
    const { data, error } = await supabase
      .from('payroll_results')
      .select('*')
      .gte('payroll_period', startDate.toISOString().split('T')[0])
      .lte('payroll_period', endDate.toISOString().split('T')[0])
      .order('payroll_period', { ascending: false });
      
    if (error) {
      console.error("Error fetching payroll results by tax year:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching payroll results by tax year:", error);
    return [];
  }
}

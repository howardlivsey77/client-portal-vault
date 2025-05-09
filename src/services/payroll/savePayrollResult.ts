
import { supabase } from "@/integrations/supabase/client";
import { PayrollResult } from "./types";
import { roundToTwoDecimals } from "@/lib/formatters";

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
    
    // Convert PayrollResult to database format (mainly converting pounds to pence)
    const payrollData = {
      employee_id: result.employeeId,
      payroll_period: periodDate.toISOString().split('T')[0], // YYYY-MM-DD format
      
      // Tax information
      tax_code: result.taxCode,
      free_pay_this_period: poundsToPence(result.monthlySalary - result.incomeTax / 0.2), // Approximate free pay
      taxable_pay_this_period: poundsToPence(result.monthlySalary),
      income_tax_this_period: poundsToPence(result.incomeTax),
      
      // NIC information
      nic_letter: result.nicCode || 'A',
      pay_liable_to_nic_this_period: poundsToPence(result.monthlySalary),
      nic_employee_this_period: poundsToPence(result.nationalInsurance),
      nic_employer_this_period: poundsToPence(result.nationalInsurance * 1.5), // Approximate employer NI
      
      // NIC bands (these would ideally come from the NIC calculator)
      earnings_at_lel_this_period: 0,
      earnings_lel_to_pt_this_period: 0,
      earnings_pt_to_uel_this_period: poundsToPence(result.monthlySalary),
      earnings_above_uel_this_period: 0,
      earnings_above_st_this_period: 0,
      
      // Student loan
      student_loan_plan: result.studentLoanPlan || null,
      student_loan_this_period: poundsToPence(result.studentLoan),
      
      // Pension
      employee_pension_this_period: poundsToPence(result.pensionContribution),
      employer_pension_this_period: poundsToPence(result.pensionContribution * 0.5), // Approximate employer contribution
      
      // Totals
      gross_pay_this_period: poundsToPence(result.grossPay),
      net_pay_this_period: poundsToPence(result.netPay)
    };
    
    // Insert into database
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

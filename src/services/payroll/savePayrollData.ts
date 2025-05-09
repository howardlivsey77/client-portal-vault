
import { supabase } from "@/integrations/supabase/client";
import { PayrollResult } from "./types";
import { poundsToPence } from "./utils/payroll-format-utils";
import { getTaxYear, getTaxPeriod } from "@/utils/taxYearUtils";
import { parseTaxCode } from "./utils/tax-code-utils";

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
    const payrollData = convertToDbFormat(result, periodDate, taxYear, taxPeriod, freePay);
    
    // Check for existing records and save
    return await saveOrUpdatePayrollRecord(result.employeeId, periodDate, taxYear, payrollData);
  } catch (error) {
    console.error("Unexpected error saving payroll result:", error);
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Convert PayrollResult to database format
 */
function convertToDbFormat(
  result: PayrollResult,
  periodDate: Date,
  taxYear: string,
  taxPeriod: number,
  freePay: number
) {
  // Convert the student loan plan to a number if it's a string
  let studentLoanPlanNumber: number | null = null;
  if (result.studentLoanPlan !== undefined && result.studentLoanPlan !== null) {
    // If it's already a number, use it directly
    studentLoanPlanNumber = typeof result.studentLoanPlan === 'number' ? 
      result.studentLoanPlan : 
      parseInt(String(result.studentLoanPlan), 10);
      
    // If parsing fails, set to null
    if (isNaN(studentLoanPlanNumber)) {
      studentLoanPlanNumber = null;
    }
  }

  return {
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
    
    // Student loan - convert to number for database
    student_loan_plan: studentLoanPlanNumber,
    student_loan_this_period: poundsToPence(result.studentLoan),
    
    // Pension
    employee_pension_this_period: poundsToPence(result.pensionContribution),
    employer_pension_this_period: poundsToPence(result.pensionContribution * 0.5), // Approximate employer contribution
    
    // Totals
    gross_pay_this_period: poundsToPence(result.grossPay),
    gross_pay_ytd: poundsToPence(result.grossPayYTD || result.grossPay),
    net_pay_this_period: poundsToPence(result.netPay)
  };
}

/**
 * Check if payroll record exists and save or update accordingly
 */
async function saveOrUpdatePayrollRecord(
  employeeId: string,
  periodDate: Date,
  taxYear: string,
  payrollData: any
): Promise<{ success: boolean, message: string, id?: string }> {
  // Check if there's already a record for this employee and period
  const { data: existingRecords, error: fetchError } = await supabase
    .from('payroll_results')
    .select('id')
    .eq('employee_id', employeeId)
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
}

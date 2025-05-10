
import { supabase } from "@/integrations/supabase/client";
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { calculateIncomeTaxFromYTDAsync } from "@/services/payroll/calculations/income-tax";

/**
 * Save payroll result to the database
 */
export async function savePayrollResultToDatabase(result: PayrollResult, payPeriod: PayPeriod) {
  if (!result.employeeId) {
    console.error("Missing employee ID for saving payroll result");
    return { success: false, error: "Missing employee ID" };
  }
  
  try {
    const payrollPeriodDate = new Date(payPeriod.year, payPeriod.month - 1, 1);
    const formattedPayrollPeriod = payrollPeriodDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Calculate taxable pay
    const taxablePay = result.grossPay - result.freePay;

    // Tax year in format YYYY/YY
    const taxYear = `${payPeriod.year}/${(payPeriod.year + 1).toString().substring(2)}`;
    const taxPeriod = payPeriod.periodNumber;
    
    console.log(`Processing payroll for tax year: ${taxYear}, period: ${taxPeriod}`);
    
    // Get previous period's YTD values
    const { data: previousPeriods, error: fetchError } = await supabase
      .from('payroll_results')
      .select('*')
      .eq('employee_id', result.employeeId)
      .eq('tax_year', taxYear)
      .lt('tax_period', taxPeriod)
      .order('tax_period', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error("Error fetching previous periods:", fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // Previous YTD values or default to 0 if first period
    const previousYTD = previousPeriods && previousPeriods.length > 0 ? previousPeriods[0] : null;
    
    // Calculate YTD values
    const grossPayYTD = previousYTD ? previousYTD.gross_pay_ytd + Math.round(result.grossPay * 100) : Math.round(result.grossPay * 100);
    const taxablePayYTD = previousYTD ? previousYTD.taxable_pay_ytd + Math.round(taxablePay * 100) : Math.round(taxablePay * 100);
    
    console.log(`YTD values: Gross Pay = ${grossPayYTD/100}, Taxable Pay = ${taxablePayYTD/100}`);
    
    // Calculate total income tax based on YTD taxable pay
    const totalTaxDueYTD = await calculateIncomeTaxFromYTDAsync(taxablePayYTD / 100, result.taxCode, taxYear);
    
    console.log(`Total tax due YTD: ${totalTaxDueYTD}`);
    
    // Previous tax paid YTD or 0 if first period
    const previousTaxPaidYTD = previousYTD ? previousYTD.income_tax_ytd : 0;
    
    console.log(`Previous tax paid YTD: ${previousTaxPaidYTD/100}`);
    
    // This period's tax is the difference between total tax due and tax already paid
    const incomeTaxThisPeriod = Math.round((totalTaxDueYTD - (previousTaxPaidYTD / 100)) * 100);
    
    console.log(`Income tax this period: ${incomeTaxThisPeriod/100}`);
    
    // New YTD tax is previous YTD + this period
    const incomeTaxYTD = previousYTD ? previousYTD.income_tax_ytd + incomeTaxThisPeriod : incomeTaxThisPeriod;
    
    // National Insurance YTD
    const nicEmployeeYTD = previousYTD ? previousYTD.nic_employee_ytd + Math.round(result.nationalInsurance * 100) : Math.round(result.nationalInsurance * 100);
    
    // Data to save to the database
    const payrollData = {
      employee_id: result.employeeId,
      payroll_period: formattedPayrollPeriod,
      tax_year: taxYear,
      tax_period: taxPeriod,
      tax_code: result.taxCode,
      student_loan_plan: result.studentLoanPlan || null,
      
      // Financial values - convert to pence/pennies for storage
      gross_pay_this_period: Math.round(result.grossPay * 100),
      taxable_pay_this_period: Math.round(taxablePay * 100),
      free_pay_this_period: Math.round(result.freePay * 100),
      income_tax_this_period: incomeTaxThisPeriod,
      
      pay_liable_to_nic_this_period: Math.round(result.grossPay * 100),
      nic_employee_this_period: Math.round(result.nationalInsurance * 100),
      nic_employer_this_period: 0, // Default to 0, update if available
      nic_letter: 'A', // Default, update if available
      
      student_loan_this_period: Math.round(result.studentLoan * 100),
      employee_pension_this_period: Math.round(result.pensionContribution * 100),
      employer_pension_this_period: 0, // Default to 0, update if available
      
      // NI earnings bands - defaults
      earnings_at_lel_this_period: 0,
      earnings_lel_to_pt_this_period: 0,
      earnings_pt_to_uel_this_period: 0,
      earnings_above_st_this_period: 0,
      earnings_above_uel_this_period: 0,
      
      // Net pay calculation
      net_pay_this_period: Math.round(result.netPay * 100),
      
      // Year-to-date values
      gross_pay_ytd: grossPayYTD,
      taxable_pay_ytd: taxablePayYTD,
      income_tax_ytd: incomeTaxYTD,
      nic_employee_ytd: nicEmployeeYTD
    };
    
    return await savePayrollData(payrollData, result.employeeId, taxYear, taxPeriod);
  } catch (error) {
    console.error("Error saving payroll result:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Save payroll data to the database
 */
async function savePayrollData(
  payrollData: any, 
  employeeId: string, 
  taxYear: string, 
  taxPeriod: number
) {
  try {
    console.log(`Checking for existing payroll record for employee ${employeeId} in tax_year ${taxYear}, tax_period ${taxPeriod}`);
    
    // Check if a record already exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('payroll_results')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('tax_year', taxYear)
      .eq('tax_period', taxPeriod)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Error checking for existing payroll record:", fetchError);
      return { success: false, error: fetchError.message };
    }
    
    let saveResponse;
    
    if (existingRecord) {
      console.log(`Found existing record with ID ${existingRecord.id}, updating it.`);
      // Update existing record
      saveResponse = await supabase
        .from('payroll_results')
        .update(payrollData)
        .eq('id', existingRecord.id);
    } else {
      console.log("No existing record found, creating a new one.");
      // Insert new record
      saveResponse = await supabase
        .from('payroll_results')
        .insert(payrollData);
    }
    
    if (saveResponse.error) {
      console.error("Error saving payroll result:", saveResponse.error);
      return { success: false, error: saveResponse.error.message };
    }
    
    console.log("Payroll result saved successfully");
    return { success: true, message: "Payroll result saved successfully" };
  } catch (error) {
    console.error("Error in savePayrollData:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Clear all payroll results from the database
 */
export async function clearPayrollResults() {
  try {
    const { error } = await supabase
      .from('payroll_results')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This condition ensures we delete all records
    
    if (error) {
      console.error("Error clearing payroll results:", error);
      return { 
        success: false, 
        error: error.message
      };
    }
    
    return { 
      success: true, 
      message: "All payroll results have been cleared."
    };
  } catch (error) {
    console.error("Error in clearPayrollResults:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

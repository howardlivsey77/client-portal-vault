
import { supabase } from "@/integrations/supabase/client";

/**
 * Save payroll data to the database
 */
export async function savePayrollData(
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

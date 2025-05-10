
import { supabase } from "@/integrations/supabase/client";

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

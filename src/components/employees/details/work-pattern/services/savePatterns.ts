
import { WorkDay } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { DAYS_OF_WEEK } from "../utils/constants";

export const saveWorkPatterns = async (employeeId: string, patterns: WorkDay[]): Promise<boolean> => {
  try {
    // First, get the employee's payroll_id
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('payroll_id')
      .eq('id', employeeId)
      .single();
      
    if (employeeError) {
      console.error("Error fetching employee data:", employeeError);
    }
    
    const payrollId = patterns[0]?.payrollId || employeeData?.payroll_id || null;
    
    // Ensure we have exactly 7 days using the DAYS_OF_WEEK constant
    const completePatterns = DAYS_OF_WEEK.map(day => {
      const existingPattern = patterns.find(p => p.day === day);
      return existingPattern || {
        day,
        isWorking: false,
        startTime: null,
        endTime: null,
        payrollId: payrollId
      };
    });
    
    // First, delete existing patterns for this employee
    const { error: deleteError } = await supabase
      .from('work_patterns')
      .delete()
      .eq('employee_id', employeeId);
      
    if (deleteError) {
      console.error("Error deleting existing work patterns:", deleteError);
      throw deleteError;
    }
    
    // Then, insert the new patterns with payroll_id
    const patternsToInsert = completePatterns.map(pattern => ({
      employee_id: employeeId,
      day: pattern.day,
      is_working: pattern.isWorking,
      start_time: pattern.startTime,
      end_time: pattern.endTime,
      payroll_id: pattern.payrollId || payrollId
    }));
    
    const { error: insertError } = await supabase
      .from('work_patterns')
      .insert(patternsToInsert);
      
    if (insertError) {
      console.error("Error inserting work patterns:", insertError);
      throw insertError;
    }
    
    return true;
  } catch (e) {
    console.error("Error in saveWorkPatterns:", e);
    return false;
  }
};

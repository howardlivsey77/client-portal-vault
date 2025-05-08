
import { WorkDay } from "../types";
import { defaultWorkPattern } from "@/types/employee";
import { supabase } from "@/integrations/supabase/client";

export const fetchWorkPatterns = async (employeeId: string): Promise<WorkDay[]> => {
  try {
    // First fetch the employee to get the payroll_id
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('payroll_id')
      .eq('id', employeeId)
      .single();
      
    if (employeeError) {
      console.error("Error fetching employee data:", employeeError);
    }
    
    const payrollId = employeeData?.payroll_id || null;
    
    // Now fetch work patterns
    const { data, error } = await supabase
      .from('work_patterns')
      .select('*')
      .eq('employee_id', employeeId)
      .order('id');
      
    if (error) {
      console.error("Error fetching work patterns:", error);
      throw error;
    }
    
    if (data && data.length > 0) {
      // Create a map of the fetched patterns by day
      const patternsByDay = new Map();
      data.forEach(pattern => {
        patternsByDay.set(pattern.day, {
          day: pattern.day,
          isWorking: pattern.is_working,
          startTime: pattern.start_time,
          endTime: pattern.end_time,
          payrollId: pattern.payroll_id || payrollId
        });
      });

      // Ensure we have all 7 days of the week
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return daysOfWeek.map(day => {
        return patternsByDay.get(day) || {
          day,
          isWorking: false,
          startTime: null,
          endTime: null,
          payrollId: payrollId
        };
      });
    }
    
    // If no patterns found, return the default pattern with payroll_id
    return defaultWorkPattern.map(pattern => ({
      ...pattern,
      payrollId: payrollId
    }));
  } catch (e) {
    console.error("Error in fetchWorkPatterns:", e);
    // Make sure to include payrollId in the default pattern
    return defaultWorkPattern.map(pattern => ({
      ...pattern,
      payrollId: null
    }));
  }
};

export const fetchWorkPatternsByPayrollId = async (payrollId: string): Promise<WorkDay[]> => {
  try {
    const { data, error } = await supabase
      .from('work_patterns')
      .select('*')
      .eq('payroll_id', payrollId)
      .order('id');
      
    if (error) {
      console.error("Error fetching work patterns by payroll ID:", error);
      throw error;
    }
    
    if (data && data.length > 0) {
      // Create a map of the fetched patterns by day
      const patternsByDay = new Map();
      data.forEach(pattern => {
        patternsByDay.set(pattern.day, {
          day: pattern.day,
          isWorking: pattern.is_working,
          startTime: pattern.start_time,
          endTime: pattern.end_time,
          payrollId: pattern.payroll_id || payrollId
        });
      });

      // Ensure we have all 7 days of the week
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return daysOfWeek.map(day => {
        return patternsByDay.get(day) || {
          day,
          isWorking: false,
          startTime: null,
          endTime: null,
          payrollId: payrollId
        };
      });
    }
    
    // Make sure to include payrollId in the default pattern
    return defaultWorkPattern.map(pattern => ({
      ...pattern,
      payrollId: payrollId
    }));
  } catch (e) {
    console.error("Error in fetchWorkPatternsByPayrollId:", e);
    return defaultWorkPattern.map(pattern => ({
      ...pattern,
      payrollId: null
    }));
  }
};

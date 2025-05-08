
import { WorkDay } from "./types";
import { defaultWorkPattern } from "@/types/employee";
import { supabase } from "@/integrations/supabase/client";

export const fetchWorkPatterns = async (employeeId: string): Promise<WorkDay[]> => {
  try {
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
          endTime: pattern.end_time
        });
      });

      // Ensure we have all 7 days of the week
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return daysOfWeek.map(day => {
        return patternsByDay.get(day) || {
          day,
          isWorking: false,
          startTime: null,
          endTime: null
        };
      });
    }
    
    // If no patterns found, return the default pattern
    return defaultWorkPattern;
  } catch (e) {
    console.error("Error in fetchWorkPatterns:", e);
    return defaultWorkPattern;
  }
};

export const saveWorkPatterns = async (employeeId: string, patterns: WorkDay[], payrollId?: string): Promise<boolean> => {
  try {
    // Ensure we have exactly 7 days
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const completePatterns = daysOfWeek.map(day => {
      const existingPattern = patterns.find(p => p.day === day);
      return existingPattern || {
        day,
        isWorking: false,
        startTime: null,
        endTime: null
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
    
    // Then, insert the new patterns with payroll_id if available
    const patternsToInsert = completePatterns.map(pattern => ({
      employee_id: employeeId,
      day: pattern.day,
      is_working: pattern.isWorking,
      start_time: pattern.startTime,
      end_time: pattern.endTime,
      payroll_id: payrollId || null
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

// Fetch work patterns by payroll ID
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
          endTime: pattern.end_time
        });
      });

      // Ensure we have all 7 days of the week
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      return daysOfWeek.map(day => {
        return patternsByDay.get(day) || {
          day,
          isWorking: false,
          startTime: null,
          endTime: null
        };
      });
    }
    
    return defaultWorkPattern;
  } catch (e) {
    console.error("Error in fetchWorkPatternsByPayrollId:", e);
    return defaultWorkPattern;
  }
};

export const formatTime = (time: string | null): string => {
  if (!time) return "";
  return time;
};

export const generateHoursList = (): string[] => {
  const timeIntervals: string[] = [];
  
  // Only generate times from 6am to 10pm (6:00 to 22:00)
  for (let hour = 6; hour <= 22; hour++) {
    const hourString = hour.toString().padStart(2, '0');
    
    // Add each 15-minute interval
    timeIntervals.push(`${hourString}:00`);
    timeIntervals.push(`${hourString}:15`);
    timeIntervals.push(`${hourString}:30`);
    timeIntervals.push(`${hourString}:45`);
  }
  
  return timeIntervals;
};

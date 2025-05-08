
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
      return data.map(pattern => ({
        day: pattern.day,
        isWorking: pattern.is_working,
        startTime: pattern.start_time,
        endTime: pattern.end_time
      }));
    }
    
    // If no patterns found, return the default pattern
    return defaultWorkPattern;
  } catch (e) {
    console.error("Error in fetchWorkPatterns:", e);
    return defaultWorkPattern;
  }
};

export const saveWorkPatterns = async (employeeId: string, patterns: WorkDay[]): Promise<boolean> => {
  try {
    // First, delete existing patterns for this employee
    const { error: deleteError } = await supabase
      .from('work_patterns')
      .delete()
      .eq('employee_id', employeeId);
      
    if (deleteError) {
      console.error("Error deleting existing work patterns:", deleteError);
      throw deleteError;
    }
    
    // Then, insert the new patterns
    const patternsToInsert = patterns.map(pattern => ({
      employee_id: employeeId,
      day: pattern.day,
      is_working: pattern.isWorking,
      start_time: pattern.startTime,
      end_time: pattern.endTime
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

export const formatTime = (time: string | null): string => {
  if (!time) return "";
  return time;
};

export const generateHoursList = (): string[] => {
  const timeIntervals: string[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const hourString = hour.toString().padStart(2, '0');
    
    // Add each 15-minute interval
    timeIntervals.push(`${hourString}:00`);
    timeIntervals.push(`${hourString}:15`);
    timeIntervals.push(`${hourString}:30`);
    timeIntervals.push(`${hourString}:45`);
  }
  
  return timeIntervals;
};

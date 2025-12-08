import { supabase } from "@/integrations/supabase/client";
import { WeeklyTimesheetDay } from "@/hooks/employees/useEmployeeTimesheet";
import { addDays, format } from "date-fns";
import { toast } from "@/hooks/common/use-toast";

/**
 * Fetches timesheet settings from the database
 */
export const fetchTimesheetSettings = async () => {
  try {
    // In a real implementation, this would fetch from a settings table
    // For now, we'll return hardcoded values that match the TimesheetSettings page
    return {
      earlyClockInTolerance: 15,
      lateClockInTolerance: 5, 
      earlyClockOutTolerance: 5,
      lateClockOutTolerance: 15,
      roundClockTimes: true,
      roundingIntervalMinutes: 15,
      requireManagerApproval: true,
      allowEmployeeNotes: true
    };
  } catch (error) {
    console.error("Error fetching timesheet settings:", error);
    // Return default settings
    return {
      earlyClockInTolerance: 15,
      lateClockInTolerance: 5,
      earlyClockOutTolerance: 5,
      lateClockOutTolerance: 15,
      roundClockTimes: false,
      roundingIntervalMinutes: 15,
      requireManagerApproval: true,
      allowEmployeeNotes: true
    };
  }
};

/**
 * Fetches timesheet entries for an employee for a specific week
 */
export const fetchTimesheetEntries = async (
  employeeId: string,
  weekStartDate: Date
): Promise<WeeklyTimesheetDay[]> => {
  try {
    // Create an array of dates for the week
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStartDate, i);
      return format(date, 'yyyy-MM-dd');
    });

    // Fetch the entries for this employee and these dates
    const { data: entries, error } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .in('date', weekDates);

    if (error) {
      console.error("Error fetching timesheet entries:", error);
      throw error;
    }

    // Convert entries to a map for easy lookup
    const entriesMap = new Map();
    if (entries) {
      entries.forEach(entry => {
        entriesMap.set(entry.date, entry);
      });
    }

    // Also fetch the employee to get their payroll_id
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('payroll_id')
      .eq('id', employeeId)
      .single();

    if (employeeError) {
      console.error("Error fetching employee:", employeeError);
    }

    const employeePayrollId = employee?.payroll_id || null;

    // Also fetch the work pattern for this employee to get scheduled times
    const { data: patterns, error: patternsError } = await supabase
      .from('work_patterns')
      .select('*')
      .eq('employee_id', employeeId);

    if (patternsError) {
      console.error("Error fetching work patterns:", patternsError);
      throw patternsError;
    }

    // Map day names to patterns
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const patternsByDay = new Map();
    
    if (patterns) {
      patterns.forEach(pattern => {
        patternsByDay.set(pattern.day, {
          isWorking: pattern.is_working,
          startTime: pattern.start_time,
          endTime: pattern.end_time,
          payrollId: pattern.payroll_id
        });
      });
    }

    // Generate the timesheet for the week
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStartDate, i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayString = dayNames[i];
      const dayPattern = patternsByDay.get(dayString);
      const entry = entriesMap.get(formattedDate);
      
      const isWorking = dayPattern?.isWorking || false;
      
      return {
        date,
        dayName: format(date, 'EEE'),
        dayString,
        isWorking,
        scheduledStart: entry?.scheduled_start || (isWorking ? dayPattern?.startTime : null),
        scheduledEnd: entry?.scheduled_end || (isWorking ? dayPattern?.endTime : null),
        actualStart: entry?.actual_start || null,
        actualEnd: entry?.actual_end || null,
        payrollId: entry?.payroll_id || employeePayrollId || dayPattern?.payrollId || null
      };
    });
  } catch (error) {
    console.error("Error in fetchTimesheetEntries:", error);
    toast({
      title: "Error fetching timesheet",
      description: "Could not load timesheet data. Please try again.",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Saves actual times for an employee's timesheet entries
 */
export const saveTimesheetEntries = async (
  employeeId: string,
  entries: { 
    date: Date, 
    scheduledStart: string | null,
    scheduledEnd: string | null,
    actualStart: string | null, 
    actualEnd: string | null,
    payrollId: string | null
  }[]
): Promise<boolean> => {
  try {
    // If payroll_id is not provided in the entries, fetch it from the employee record
    let employeePayrollId = entries[0]?.payrollId;
    
    if (!employeePayrollId) {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('payroll_id')
        .eq('id', employeeId)
        .single();
        
      if (!employeeError && employee?.payroll_id) {
        employeePayrollId = employee.payroll_id;
      }
    }

    // Prepare the entries for upsert
    const upsertEntries = entries.map(entry => ({
      employee_id: employeeId,
      date: format(entry.date, 'yyyy-MM-dd'),
      scheduled_start: entry.scheduledStart,
      scheduled_end: entry.scheduledEnd,
      actual_start: entry.actualStart,
      actual_end: entry.actualEnd,
      payroll_id: entry.payrollId || employeePayrollId
    }));

    // Use upsert to handle both insert and update cases
    const { error } = await supabase
      .from('timesheet_entries')
      .upsert(upsertEntries, { 
        onConflict: 'employee_id, date',
        ignoreDuplicates: false
      });

    if (error) {
      console.error("Error saving timesheet entries:", error);
      toast({
        title: "Error saving timesheet",
        description: "Could not save timesheet data. Please try again.",
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Timesheet saved",
      description: "Your timesheet has been updated successfully."
    });
    
    return true;
  } catch (error) {
    console.error("Error in saveTimesheetEntries:", error);
    toast({
      title: "Error saving timesheet",
      description: "Could not save timesheet data. Please try again.",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Syncs timesheet entries with employee payroll IDs
 */
export const syncTimesheetPayrollIds = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('sync_timesheet_entries_payroll_ids');
    
    if (error) {
      console.error("Error syncing timesheet payroll IDs:", error);
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    console.error("Error in syncTimesheetPayrollIds:", error);
    return 0;
  }
};

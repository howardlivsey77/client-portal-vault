
import { format, parse, addMinutes, subMinutes } from 'date-fns';

/**
 * Checks if an actual time is outside the tolerance range for a scheduled time
 */
export const isTimeOutsideTolerance = (
  scheduledTime: string | null,
  actualTime: string | null,
  earlyTolerance: number,
  lateTolerance: number,
  isStartTime: boolean
): boolean => {
  if (!scheduledTime || !actualTime) return false;

  try {
    // Parse the time strings into Date objects for comparison
    // We'll use a placeholder date (today) since we only care about the time
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const scheduledDate = parse(`${todayStr} ${scheduledTime}`, 'yyyy-MM-dd HH:mm', new Date());
    const actualDate = parse(`${todayStr} ${actualTime}`, 'yyyy-MM-dd HH:mm', new Date());
    
    if (isStartTime) {
      // For start time: actual should not be earlier than (scheduled - earlyTolerance)
      // and not later than (scheduled + lateTolerance)
      const earliestAllowed = subMinutes(scheduledDate, earlyTolerance);
      const latestAllowed = addMinutes(scheduledDate, lateTolerance);
      
      return actualDate < earliestAllowed || actualDate > latestAllowed;
    } else {
      // For end time: actual should not be earlier than (scheduled - earlyTolerance)
      // and not later than (scheduled + lateTolerance)
      const earliestAllowed = subMinutes(scheduledDate, earlyTolerance);
      const latestAllowed = addMinutes(scheduledDate, lateTolerance);
      
      return actualDate < earliestAllowed || actualDate > latestAllowed;
    }
  } catch (error) {
    console.error("Error comparing times:", error);
    return false;
  }
};

/**
 * Fetches the timesheet settings from the database
 */
export const fetchTimesheetSettings = async () => {
  try {
    // Mock settings - in a real application, fetch from database
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

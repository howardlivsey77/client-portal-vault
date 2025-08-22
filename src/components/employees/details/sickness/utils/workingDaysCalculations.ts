import { WorkDay } from "@/components/employees/details/work-pattern/types";

/**
 * Get the day name for a given date
 */
const getDayName = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

/**
 * Count working days between two dates based on work pattern
 */
export const countWorkingDaysBetween = (
  startDate: string,
  endDate: string,
  workPattern: WorkDay[]
): number => {
  if (!startDate || !endDate || !workPattern || workPattern.length === 0) {
    return 0;
  }

  // Create a set of working days for quick lookup
  const workingDays = new Set(
    workPattern.filter(day => day.isWorking).map(day => day.day)
  );

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Ensure start is not after end
  if (start > end) {
    return 0;
  }

  let workingDaysCount = 0;
  const current = new Date(start);

  // Iterate through each day and count working days
  while (current <= end) {
    const dayName = getDayName(current);
    if (workingDays.has(dayName)) {
      workingDaysCount++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDaysCount;
};

/**
 * Calculate working days for a sickness record
 * If end_date is not provided, defaults to 1 working day (ongoing absence)
 */
export const calculateWorkingDaysForRecord = (
  startDate: string,
  endDate: string | null | undefined,
  workPattern: WorkDay[]
): number => {
  if (!startDate || !workPattern || workPattern.length === 0) {
    return 0;
  }

  // If no end date, check if start date is a working day
  if (!endDate) {
    const dayName = getDayName(new Date(startDate));
    const isWorkingDay = workPattern.some(day => day.day === dayName && day.isWorking);
    return isWorkingDay ? 1 : 0;
  }

  return countWorkingDaysBetween(startDate, endDate, workPattern);
};
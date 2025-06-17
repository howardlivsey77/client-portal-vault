
import { WorkDay } from "@/components/employees/details/work-pattern/types";

/**
 * Calculate the number of working days per week from a work pattern
 */
export const calculateWorkingDaysPerWeek = (workPattern: WorkDay[]): number => {
  if (!workPattern || workPattern.length === 0) {
    return 5; // Default to 5 days if no pattern provided
  }
  
  return workPattern.filter(day => day.isWorking).length;
};

/**
 * Convert months entitlement to days using the correct formula:
 * workingDaysPerWeek × 52.14 ÷ 12 × months (rounded down)
 */
export const convertMonthsToDays = (months: number, workingDaysPerWeek: number): number => {
  const daysPerMonth = (workingDaysPerWeek * 52.14) / 12;
  return Math.floor(daysPerMonth * months);
};

/**
 * Convert entitlement amount to days based on unit and work pattern
 */
export const convertEntitlementToDays = (
  amount: number,
  unit: 'days' | 'weeks' | 'months',
  workingDaysPerWeek: number
): number => {
  switch (unit) {
    case 'days':
      return amount;
    case 'weeks':
      return amount * workingDaysPerWeek;
    case 'months':
      return convertMonthsToDays(amount, workingDaysPerWeek);
    default:
      return amount;
  }
};


import { WorkDay } from "@/components/employees/details/work-pattern/types";

/**
 * Calculate the number of working days per week from a work pattern
 */
export const calculateWorkingDaysPerWeek = (workPattern: WorkDay[]): number => {
  if (!workPattern || workPattern.length === 0) {
    console.log('No work pattern provided, defaulting to 5 days');
    return 5; // Default to 5 days if no pattern provided
  }
  
  const workingDays = workPattern.filter(day => day.isWorking).length;
  console.log('Work pattern:', workPattern);
  console.log('Calculated working days per week:', workingDays);
  
  return workingDays;
};

/**
 * Convert months entitlement to days using the correct formula:
 * workingDaysPerWeek × 52.14 ÷ 12 × months (rounded down)
 */
export const convertMonthsToDays = (months: number, workingDaysPerWeek: number): number => {
  const daysPerMonth = (workingDaysPerWeek * 52.14) / 12;
  const result = Math.floor(daysPerMonth * months);
  
  console.log(`Converting ${months} months to days:`);
  console.log(`Working days per week: ${workingDaysPerWeek}`);
  console.log(`Days per month: ${daysPerMonth}`);
  console.log(`Total days (before rounding): ${daysPerMonth * months}`);
  console.log(`Total days (rounded down): ${result}`);
  
  return result;
};

/**
 * Convert entitlement amount to days based on unit and work pattern
 */
export const convertEntitlementToDays = (
  amount: number,
  unit: 'days' | 'weeks' | 'months',
  workingDaysPerWeek: number
): number => {
  console.log(`Converting entitlement: ${amount} ${unit}, working ${workingDaysPerWeek} days per week`);
  
  let result: number;
  
  switch (unit) {
    case 'days':
      result = amount;
      break;
    case 'weeks':
      result = amount * workingDaysPerWeek;
      break;
    case 'months':
      result = convertMonthsToDays(amount, workingDaysPerWeek);
      break;
    default:
      result = amount;
  }
  
  console.log(`Conversion result: ${result} days`);
  return result;
};

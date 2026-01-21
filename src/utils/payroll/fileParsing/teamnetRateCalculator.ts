/**
 * Calculate rate assignments for Teamnet overtime based on shift times
 * 
 * Priority order:
 * 1. Custom company holidays (highest priority)
 * 2. UK bank holidays (if enabled)
 * 3. Day-of-week conditions from company config
 * 4. Default rules
 * 
 * Default rules (when no company config):
 * Rate 3: Sunday all day, Mon-Fri 18:30-20:00, Sat 10:00-14:00
 * Rate 2: All other times
 * 
 * Company-specific rules can be configured via the database
 */

import { RateCondition, TeamnetRateConfig } from "@/features/company-settings/types/teamnetRateConfig";
import { CompanyHoliday, CompanyHolidaySettings } from "@/features/company-settings/types/companyHoliday";
import { isUkBankHoliday, getUkBankHolidayName } from "@/utils/ukBankHolidays";
import { format } from "date-fns";

export interface RateHours {
  rate2Hours: number;
  rate3Hours: number;
  rate4Hours?: number;
}

export interface HolidayConfig {
  holidays?: CompanyHoliday[];
  settings?: CompanyHolidaySettings | null;
}

// Re-export types for backward compatibility
export type { RateCondition, TeamnetRateConfig } from "@/features/company-settings/types/teamnetRateConfig";

// Map day numbers to day names
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Parse time string (HH:MM or HH:MM:SS) to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Convert minutes to hours (decimal)
 */
function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate overlapping minutes between two time ranges
 * All values are in minutes since midnight
 */
function calculateOverlap(
  shiftStart: number,
  shiftEnd: number,
  windowStart: number,
  windowEnd: number
): number {
  const overlapStart = Math.max(shiftStart, windowStart);
  const overlapEnd = Math.min(shiftEnd, windowEnd);
  return Math.max(0, overlapEnd - overlapStart);
}

/**
 * Check if a date matches a holiday (custom or UK bank holiday)
 * Returns the holiday rate if matched, null otherwise
 */
function findHolidayRate(
  date: Date,
  holidayConfig?: HolidayConfig
): { rate: number; name: string; isAllDay: boolean } | null {
  if (!holidayConfig) return null;
  
  const { holidays, settings } = holidayConfig;
  const dateStr = format(date, "yyyy-MM-dd");
  const monthDay = format(date, "MM-dd"); // For recurring holidays
  
  // Priority 1: Check custom company holidays first
  if (holidays && holidays.length > 0) {
    for (const holiday of holidays) {
      // Check exact date match
      if (holiday.date === dateStr) {
        console.log(`[Holiday Match] ${dateStr} matches custom holiday: ${holiday.name} (Rate ${holiday.rate_override})`);
        return {
          rate: holiday.rate_override,
          name: holiday.name,
          isAllDay: holiday.all_day,
        };
      }
      
      // Check recurring holidays (same month and day)
      if (holiday.is_recurring) {
        const holidayMonthDay = holiday.date.substring(5); // "MM-DD" from "YYYY-MM-DD"
        if (holidayMonthDay === monthDay) {
          console.log(`[Holiday Match] ${dateStr} matches recurring holiday: ${holiday.name} (Rate ${holiday.rate_override})`);
          return {
            rate: holiday.rate_override,
            name: holiday.name,
            isAllDay: holiday.all_day,
          };
        }
      }
    }
  }
  
  // Priority 2: Check UK bank holidays if enabled
  if (settings?.use_uk_bank_holidays !== false) {
    const bankHolidayName = getUkBankHolidayName(date);
    if (bankHolidayName) {
      const rate = settings?.bank_holiday_rate ?? 3;
      console.log(`[Holiday Match] ${dateStr} is UK bank holiday: ${bankHolidayName} (Rate ${rate})`);
      return {
        rate,
        name: bankHolidayName,
        isAllDay: true,
      };
    }
  }
  
  return null;
}

/**
 * Calculate rate hours using company-specific configuration
 * If sourceDurationMinutes differs from calculatedMinutes, rates are proportionally scaled
 */
function calculateWithConfig(
  shiftStart: number,
  shiftEnd: number,
  dayOfWeek: number,
  calculatedMinutes: number,
  sourceDurationMinutes: number,
  config: TeamnetRateConfig
): RateHours {
  const dayName = DAY_NAMES[dayOfWeek];
  const rateMinutes: Record<number, number> = { 2: 0, 3: 0, 4: 0 };
  
  // Calculate minutes for each matching condition based on time range overlap
  for (const condition of config.conditions) {
    if (condition.days.includes(dayName)) {
      const windowStart = parseTimeToMinutes(condition.time_from);
      const windowEnd = parseTimeToMinutes(condition.time_to);
      const overlap = calculateOverlap(shiftStart, shiftEnd, windowStart, windowEnd);
      
      if (overlap > 0 && condition.rate >= 2 && condition.rate <= 4) {
        rateMinutes[condition.rate] += overlap;
      }
    }
  }
  
  // Calculate total assigned minutes from time-range calculation
  const assignedMinutes = rateMinutes[2] + rateMinutes[3] + rateMinutes[4];
  
  // Remaining minutes go to default rate
  const remainingMinutes = calculatedMinutes - assignedMinutes;
  if (remainingMinutes > 0) {
    const defaultRate = Math.max(2, Math.min(4, config.default_rate));
    rateMinutes[defaultRate] += remainingMinutes;
  }
  
  // If source duration differs from calculated, scale proportionally
  if (sourceDurationMinutes !== calculatedMinutes && calculatedMinutes > 0) {
    const scale = sourceDurationMinutes / calculatedMinutes;
    rateMinutes[2] = rateMinutes[2] * scale;
    rateMinutes[3] = rateMinutes[3] * scale;
    rateMinutes[4] = rateMinutes[4] * scale;
  }
  
  return {
    rate2Hours: minutesToHours(rateMinutes[2]),
    rate3Hours: minutesToHours(rateMinutes[3]),
    rate4Hours: minutesToHours(rateMinutes[4])
  };
}

/**
 * Calculate rate hours using hardcoded default rules
 * If sourceDurationMinutes differs from calculatedMinutes, rates are proportionally scaled
 */
function calculateWithDefaults(
  shiftStart: number,
  shiftEnd: number,
  dayOfWeek: number,
  calculatedMinutes: number,
  sourceDurationMinutes: number
): RateHours {
  let rate3Minutes = 0;
  
  // Rate 3 windows (in minutes since midnight)
  const weekdayRate3Start = parseTimeToMinutes('18:30'); // 1110 minutes
  const weekdayRate3End = parseTimeToMinutes('20:00');   // 1200 minutes
  const saturdayRate3Start = parseTimeToMinutes('10:00'); // 600 minutes
  const saturdayRate3End = parseTimeToMinutes('14:00');   // 840 minutes
  
  // Check if Sunday (0) - all hours at Rate 3
  if (dayOfWeek === 0) {
    rate3Minutes = calculatedMinutes;
  }
  // Check if weekday (Mon-Fri: 1-5)
  else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    rate3Minutes = calculateOverlap(shiftStart, shiftEnd, weekdayRate3Start, weekdayRate3End);
  }
  // Check if Saturday (6)
  else if (dayOfWeek === 6) {
    rate3Minutes = calculateOverlap(shiftStart, shiftEnd, saturdayRate3Start, saturdayRate3End);
  }
  
  let rate2Minutes = calculatedMinutes - rate3Minutes;
  
  // If source duration differs from calculated, scale proportionally
  if (sourceDurationMinutes !== calculatedMinutes && calculatedMinutes > 0) {
    const scale = sourceDurationMinutes / calculatedMinutes;
    rate2Minutes = rate2Minutes * scale;
    rate3Minutes = rate3Minutes * scale;
  }
  
  return {
    rate2Hours: minutesToHours(rate2Minutes),
    rate3Hours: minutesToHours(rate3Minutes)
  };
}

/**
 * Calculate rate hours for a single shift
 * 
 * @param timeFrom - Start time string (HH:MM)
 * @param timeTo - End time string (HH:MM)
 * @param date - Date of the shift
 * @param config - Optional company-specific rate configuration
 * @param employeeName - Optional employee name for debug logging
 * @param holidayConfig - Optional holiday configuration (custom holidays + settings)
 * @returns Object with rate2Hours, rate3Hours, and optionally rate4Hours
 */
export function calculateTeamnetRates(
  timeFrom: string,
  timeTo: string,
  date: Date,
  config?: TeamnetRateConfig | null,
  employeeName?: string,
  holidayConfig?: HolidayConfig,
  sourceDuration?: number, // Optional: use Duration column from source file instead of calculating
  explicitRate?: number // Optional: explicit rate from file (2, 3, or 4) - bypasses all time-window calculation
): RateHours {
  const shiftStart = parseTimeToMinutes(timeFrom);
  let shiftEnd = parseTimeToMinutes(timeTo);
  
  // Handle overnight shifts (end time is next day)
  if (shiftEnd <= shiftStart) {
    shiftEnd += 24 * 60; // Add 24 hours
  }
  
  // Use source duration if provided, otherwise calculate from time range
  const calculatedMinutes = shiftEnd - shiftStart;
  const totalMinutes = sourceDuration !== undefined && sourceDuration > 0 
    ? sourceDuration * 60 
    : calculatedMinutes;
  const totalHours = minutesToHours(totalMinutes);
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const dayName = DAY_NAMES[dayOfWeek];
  
  // PRIORITY 0: If explicit rate is provided from file, use it directly (bypass all calculation)
  if (explicitRate !== undefined && explicitRate >= 2 && explicitRate <= 4) {
    console.log(`[RATE] Using explicit rate from file: Rate ${explicitRate} for ${totalHours}h (${employeeName || 'unknown'})`);
    return {
      rate2Hours: explicitRate === 2 ? totalHours : 0,
      rate3Hours: explicitRate === 3 ? totalHours : 0,
      rate4Hours: explicitRate === 4 ? totalHours : 0,
    };
  }
  
  // Debug logging for specific employees or all if DEBUG_RATES is true
  const debugEmployees = ['Lewis Rushworth', 'Azra Javaid', 'Deborah Clifford'];
  const shouldLog = employeeName && debugEmployees.some(name => 
    employeeName.toLowerCase().includes(name.toLowerCase().split(' ')[0])
  );
  
  if (shouldLog) {
    console.log(`[RATE DEBUG] Employee: ${employeeName}`);
    console.log(`[RATE DEBUG]   Date: ${date.toISOString().split('T')[0]} (${dayName}, dayOfWeek=${dayOfWeek})`);
    console.log(`[RATE DEBUG]   Shift: ${timeFrom} - ${timeTo}`);
    console.log(`[RATE DEBUG]   Shift in minutes: ${shiftStart} - ${shiftEnd} (total: ${totalMinutes} mins)`);
  }
  
  // PRIORITY 1 & 2: Check for holiday override (custom or UK bank holiday)
  const holidayMatch = findHolidayRate(date, holidayConfig);
  if (holidayMatch && holidayMatch.isAllDay) {
    // Entire shift goes to holiday rate
    const result: RateHours = {
      rate2Hours: holidayMatch.rate === 2 ? totalHours : 0,
      rate3Hours: holidayMatch.rate === 3 ? totalHours : 0,
      rate4Hours: holidayMatch.rate === 4 ? totalHours : 0,
    };
    
    if (shouldLog) {
      console.log(`[RATE DEBUG]   Holiday override: ${holidayMatch.name} -> Rate ${holidayMatch.rate}`);
      console.log(`[RATE DEBUG]   Result: Rate2=${result.rate2Hours}h, Rate3=${result.rate3Hours}h, Rate4=${result.rate4Hours}h`);
      console.log(`[RATE DEBUG]   ---`);
    }
    
    return result;
  }
  
  // PRIORITY 3: Use company config if provided
  // PRIORITY 4: Otherwise use defaults
  let result: RateHours;
  if (config && config.conditions && config.conditions.length > 0) {
    result = calculateWithConfig(shiftStart, shiftEnd, dayOfWeek, calculatedMinutes, totalMinutes, config);
  } else {
    result = calculateWithDefaults(shiftStart, shiftEnd, dayOfWeek, calculatedMinutes, totalMinutes);
  }
  
  if (shouldLog) {
    // Calculate what Rate 3 overlap would be for weekday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const weekdayRate3Start = parseTimeToMinutes('18:30'); // 1110 minutes
      const weekdayRate3End = parseTimeToMinutes('20:00');   // 1200 minutes
      const overlap = calculateOverlap(shiftStart, shiftEnd, weekdayRate3Start, weekdayRate3End);
      console.log(`[RATE DEBUG]   Weekday Rate 3 window: 18:30-20:00 (${weekdayRate3Start}-${weekdayRate3End} mins)`);
      console.log(`[RATE DEBUG]   Rate 3 overlap calculation: max(${shiftStart}, ${weekdayRate3Start}) to min(${shiftEnd}, ${weekdayRate3End}) = ${overlap} mins`);
    }
    console.log(`[RATE DEBUG]   Result: Rate2=${result.rate2Hours}h, Rate3=${result.rate3Hours}h`);
    console.log(`[RATE DEBUG]   ---`);
  }
  
  return result;
}

/**
 * Parse a date string in various formats, including Excel serial dates
 * IMPORTANT: Always interprets slash-delimited dates as UK format (DD/MM/YYYY)
 */
export function parseTeamnetDate(dateStr: string | Date): Date | null {
  if (!dateStr) return null;
  
  // Handle Date objects (XLSX library might parse dates)
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr;
  }
  
  const trimmed = String(dateStr).trim();
  
  // Handle Excel serial dates (numeric string like "46002" or "45678.5")
  const numericValue = parseFloat(trimmed);
  if (!isNaN(numericValue) && /^\d+(\.\d+)?$/.test(trimmed)) {
    // Validate range (1 to 100000 covers dates from 1900 to ~2173)
    if (numericValue >= 1 && numericValue <= 100000) {
      // Excel epoch adjustment (Excel incorrectly treats 1900 as leap year)
      const adjustedDate = numericValue > 60 ? numericValue - 1 : numericValue;
      const msPerDay = 24 * 60 * 60 * 1000;
      const jsDate = new Date(Date.UTC(1899, 11, 30) + (adjustedDate * msPerDay));
      if (!isNaN(jsDate.getTime())) {
        console.log(`[Date Parse] Excel serial ${trimmed} -> ${jsDate.toISOString().split('T')[0]}`);
        return jsDate;
      }
    }
  }
  
  // Try DD/MM/YYYY format (UK format - ALWAYS use this for slash-delimited dates)
  const ukMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    const parsedDay = parseInt(day, 10);
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);
    
    // Validate the date components
    if (parsedMonth >= 1 && parsedMonth <= 12 && parsedDay >= 1 && parsedDay <= 31) {
      const result = new Date(parsedYear, parsedMonth - 1, parsedDay);
      console.log(`[Date Parse] UK format ${trimmed} -> ${result.toISOString().split('T')[0]} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][result.getDay()]})`);
      return result;
    }
  }
  
  // Try YYYY-MM-DD format (ISO)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    console.log(`[Date Parse] ISO format ${trimmed} -> ${result.toISOString().split('T')[0]}`);
    return result;
  }
  
  // DO NOT fall back to Date.parse() for slash-delimited dates
  // as JavaScript may interpret them as US MM/DD/YYYY format
  console.warn(`[Date Parse] Could not parse date: "${trimmed}" - no matching format`);
  return null;
}

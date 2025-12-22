/**
 * Calculate rate assignments for Teamnet overtime based on shift times
 * 
 * Default rules (when no company config):
 * Rate 3: Sunday all day, Mon-Fri 18:30-20:00, Sat 10:00-14:00
 * Rate 2: All other times
 * 
 * Company-specific rules can be configured via the database
 */

import { RateCondition, TeamnetRateConfig } from "@/features/company-settings/types/teamnetRateConfig";

export interface RateHours {
  rate2Hours: number;
  rate3Hours: number;
  rate4Hours?: number;
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
 * Calculate rate hours using company-specific configuration
 */
function calculateWithConfig(
  shiftStart: number,
  shiftEnd: number,
  dayOfWeek: number,
  totalMinutes: number,
  config: TeamnetRateConfig
): RateHours {
  const dayName = DAY_NAMES[dayOfWeek];
  const rateMinutes: Record<number, number> = { 2: 0, 3: 0, 4: 0 };
  
  // Calculate minutes for each matching condition
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
  
  // Calculate total assigned minutes
  const assignedMinutes = rateMinutes[2] + rateMinutes[3] + rateMinutes[4];
  
  // Remaining minutes go to default rate
  const remainingMinutes = totalMinutes - assignedMinutes;
  if (remainingMinutes > 0) {
    const defaultRate = Math.max(2, Math.min(4, config.default_rate));
    rateMinutes[defaultRate] += remainingMinutes;
  }
  
  return {
    rate2Hours: minutesToHours(rateMinutes[2]),
    rate3Hours: minutesToHours(rateMinutes[3]),
    rate4Hours: minutesToHours(rateMinutes[4])
  };
}

/**
 * Calculate rate hours using hardcoded default rules
 */
function calculateWithDefaults(
  shiftStart: number,
  shiftEnd: number,
  dayOfWeek: number,
  totalMinutes: number
): RateHours {
  let rate3Minutes = 0;
  
  // Rate 3 windows (in minutes since midnight)
  const weekdayRate3Start = parseTimeToMinutes('18:30'); // 1110 minutes
  const weekdayRate3End = parseTimeToMinutes('20:00');   // 1200 minutes
  const saturdayRate3Start = parseTimeToMinutes('10:00'); // 600 minutes
  const saturdayRate3End = parseTimeToMinutes('14:00');   // 840 minutes
  
  // Check if Sunday (0) - all hours at Rate 3
  if (dayOfWeek === 0) {
    rate3Minutes = totalMinutes;
  }
  // Check if weekday (Mon-Fri: 1-5)
  else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    rate3Minutes = calculateOverlap(shiftStart, shiftEnd, weekdayRate3Start, weekdayRate3End);
  }
  // Check if Saturday (6)
  else if (dayOfWeek === 6) {
    rate3Minutes = calculateOverlap(shiftStart, shiftEnd, saturdayRate3Start, saturdayRate3End);
  }
  const rate2Minutes = totalMinutes - rate3Minutes;
  
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
 * @returns Object with rate2Hours, rate3Hours, and optionally rate4Hours
 */
export function calculateTeamnetRates(
  timeFrom: string,
  timeTo: string,
  date: Date,
  config?: TeamnetRateConfig | null,
  employeeName?: string
): RateHours {
  const shiftStart = parseTimeToMinutes(timeFrom);
  let shiftEnd = parseTimeToMinutes(timeTo);
  
  // Handle overnight shifts (end time is next day)
  if (shiftEnd <= shiftStart) {
    shiftEnd += 24 * 60; // Add 24 hours
  }
  
  const totalMinutes = shiftEnd - shiftStart;
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const dayName = DAY_NAMES[dayOfWeek];
  
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
    
    // Calculate what Rate 3 overlap would be for weekday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const weekdayRate3Start = parseTimeToMinutes('18:30'); // 1110 minutes
      const weekdayRate3End = parseTimeToMinutes('20:00');   // 1200 minutes
      const overlap = calculateOverlap(shiftStart, shiftEnd, weekdayRate3Start, weekdayRate3End);
      console.log(`[RATE DEBUG]   Weekday Rate 3 window: 18:30-20:00 (${weekdayRate3Start}-${weekdayRate3End} mins)`);
      console.log(`[RATE DEBUG]   Rate 3 overlap calculation: max(${shiftStart}, ${weekdayRate3Start}) to min(${shiftEnd}, ${weekdayRate3End}) = ${overlap} mins`);
    }
  }
  
  // Use company config if provided, otherwise use defaults
  let result: RateHours;
  if (config && config.conditions && config.conditions.length > 0) {
    result = calculateWithConfig(shiftStart, shiftEnd, dayOfWeek, totalMinutes, config);
  } else {
    result = calculateWithDefaults(shiftStart, shiftEnd, dayOfWeek, totalMinutes);
  }
  
  if (shouldLog) {
    console.log(`[RATE DEBUG]   Result: Rate2=${result.rate2Hours}h, Rate3=${result.rate3Hours}h`);
    console.log(`[RATE DEBUG]   ---`);
  }
  
  return result;
}

/**
 * Parse a date string in various formats
 */
export function parseTeamnetDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try DD/MM/YYYY format first (common UK format)
  const ukMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try YYYY-MM-DD format (ISO)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fall back to Date.parse
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

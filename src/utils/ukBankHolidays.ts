import { format, parseISO, isEqual } from "date-fns";

export interface UkBankHoliday {
  date: string;
  name: string;
}

// UK Bank Holidays for England and Wales
// Source: https://www.gov.uk/bank-holidays
export const UK_BANK_HOLIDAYS: Record<number, UkBankHoliday[]> = {
  2024: [
    { date: "2024-01-01", name: "New Year's Day" },
    { date: "2024-03-29", name: "Good Friday" },
    { date: "2024-04-01", name: "Easter Monday" },
    { date: "2024-05-06", name: "Early May bank holiday" },
    { date: "2024-05-27", name: "Spring bank holiday" },
    { date: "2024-08-26", name: "Summer bank holiday" },
    { date: "2024-12-25", name: "Christmas Day" },
    { date: "2024-12-26", name: "Boxing Day" },
  ],
  2025: [
    { date: "2025-01-01", name: "New Year's Day" },
    { date: "2025-04-18", name: "Good Friday" },
    { date: "2025-04-21", name: "Easter Monday" },
    { date: "2025-05-05", name: "Early May bank holiday" },
    { date: "2025-05-26", name: "Spring bank holiday" },
    { date: "2025-08-25", name: "Summer bank holiday" },
    { date: "2025-12-25", name: "Christmas Day" },
    { date: "2025-12-26", name: "Boxing Day" },
  ],
  2026: [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-04-03", name: "Good Friday" },
    { date: "2026-04-06", name: "Easter Monday" },
    { date: "2026-05-04", name: "Early May bank holiday" },
    { date: "2026-05-25", name: "Spring bank holiday" },
    { date: "2026-08-31", name: "Summer bank holiday" },
    { date: "2026-12-25", name: "Christmas Day" },
    { date: "2026-12-28", name: "Boxing Day (substitute)" },
  ],
  2027: [
    { date: "2027-01-01", name: "New Year's Day" },
    { date: "2027-03-26", name: "Good Friday" },
    { date: "2027-03-29", name: "Easter Monday" },
    { date: "2027-05-03", name: "Early May bank holiday" },
    { date: "2027-05-31", name: "Spring bank holiday" },
    { date: "2027-08-30", name: "Summer bank holiday" },
    { date: "2027-12-27", name: "Christmas Day (substitute)" },
    { date: "2027-12-28", name: "Boxing Day (substitute)" },
  ],
  2028: [
    { date: "2028-01-03", name: "New Year's Day (substitute)" },
    { date: "2028-04-14", name: "Good Friday" },
    { date: "2028-04-17", name: "Easter Monday" },
    { date: "2028-05-01", name: "Early May bank holiday" },
    { date: "2028-05-29", name: "Spring bank holiday" },
    { date: "2028-08-28", name: "Summer bank holiday" },
    { date: "2028-12-25", name: "Christmas Day" },
    { date: "2028-12-26", name: "Boxing Day" },
  ],
  2029: [
    { date: "2029-01-01", name: "New Year's Day" },
    { date: "2029-03-30", name: "Good Friday" },
    { date: "2029-04-02", name: "Easter Monday" },
    { date: "2029-05-07", name: "Early May bank holiday" },
    { date: "2029-05-28", name: "Spring bank holiday" },
    { date: "2029-08-27", name: "Summer bank holiday" },
    { date: "2029-12-25", name: "Christmas Day" },
    { date: "2029-12-26", name: "Boxing Day" },
  ],
  2030: [
    { date: "2030-01-01", name: "New Year's Day" },
    { date: "2030-04-19", name: "Good Friday" },
    { date: "2030-04-22", name: "Easter Monday" },
    { date: "2030-05-06", name: "Early May bank holiday" },
    { date: "2030-05-27", name: "Spring bank holiday" },
    { date: "2030-08-26", name: "Summer bank holiday" },
    { date: "2030-12-25", name: "Christmas Day" },
    { date: "2030-12-26", name: "Boxing Day" },
  ],
};

/**
 * Check if a given date is a UK bank holiday
 */
export function isUkBankHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = UK_BANK_HOLIDAYS[year];
  
  if (!holidays) return false;
  
  const dateStr = format(date, "yyyy-MM-dd");
  return holidays.some(h => h.date === dateStr);
}

/**
 * Get the name of the UK bank holiday for a given date, or null if not a holiday
 */
export function getUkBankHolidayName(date: Date): string | null {
  const year = date.getFullYear();
  const holidays = UK_BANK_HOLIDAYS[year];
  
  if (!holidays) return null;
  
  const dateStr = format(date, "yyyy-MM-dd");
  const holiday = holidays.find(h => h.date === dateStr);
  return holiday?.name ?? null;
}

/**
 * Get all UK bank holidays for a given year
 */
export function getUkBankHolidaysForYear(year: number): UkBankHoliday[] {
  return UK_BANK_HOLIDAYS[year] ?? [];
}

/**
 * Get upcoming UK bank holidays from today
 */
export function getUpcomingUkBankHolidays(count: number = 10): UkBankHoliday[] {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const currentYear = today.getFullYear();
  
  const allHolidays: UkBankHoliday[] = [];
  
  // Collect holidays for current and next few years
  for (let year = currentYear; year <= currentYear + 2; year++) {
    const holidays = UK_BANK_HOLIDAYS[year] ?? [];
    allHolidays.push(...holidays);
  }
  
  // Filter to upcoming holidays and limit
  return allHolidays
    .filter(h => h.date >= todayStr)
    .slice(0, count);
}

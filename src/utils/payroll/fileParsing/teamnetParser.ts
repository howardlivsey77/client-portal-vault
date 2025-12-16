/**
 * Parser for Teamnet overtime format
 * 
 * Expected columns: Name, Surname, Main role, Date from, Time from, Date to, Time to, Duration, Units, Notes
 */

import { ExtraHoursSummary, EmployeeHoursData } from '@/components/payroll/types';
import { calculateTeamnetRates, parseTeamnetDate, RateHours } from './teamnetRateCalculator';

interface TeamnetRow {
  Name?: string;
  Surname?: string;
  'Main role'?: string;
  'Date from'?: string;
  'Time from'?: string;
  'Date to'?: string;
  'Time to'?: string;
  Duration?: string | number;
  Units?: string | number;
  Notes?: string;
  // Allow for case variations
  [key: string]: any;
}

interface EmployeeRateAccumulator {
  employeeName: string;
  rate2Hours: number;
  rate3Hours: number;
  entries: number;
}

/**
 * Find a column value by checking various case/spelling variations
 * Uses case-insensitive matching with trimming
 */
function getColumnValue(row: TeamnetRow, possibleNames: string[]): string {
  // First try exact match
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null) {
      return String(row[name]).trim();
    }
  }
  
  // Fall back to case-insensitive matching
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().trim();
    const matchingKey = rowKeys.find(k => k.toLowerCase().trim() === normalizedName);
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return String(row[matchingKey]).trim();
    }
  }
  
  return '';
}

/**
 * Check if the data appears to be in Teamnet format
 */
export function isTeamnetFormat(jsonData: any[]): boolean {
  if (!jsonData || jsonData.length === 0) return false;
  
  const firstRow = jsonData[0];
  const keys = Object.keys(firstRow).map(k => k.toLowerCase());
  
  // Teamnet format has Name column and Time from/Time to columns
  // Surname is optional - some exports have combined Name column with full name
  const hasName = keys.some(k => k === 'name');
  const hasTimeFrom = keys.some(k => k.includes('time from') || k === 'time_from');
  const hasTimeTo = keys.some(k => k.includes('time to') || k === 'time_to');
  
  return hasName && hasTimeFrom && hasTimeTo;
}

/**
 * Parse Teamnet data and calculate rates based on shift times
 */
export function parseTeamnetData(jsonData: any[]): ExtraHoursSummary {
  const employeeMap = new Map<string, EmployeeRateAccumulator>();
  
  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;
  
  // Debug: Log column names from first row
  if (jsonData.length > 0) {
    const columnNames = Object.keys(jsonData[0]);
    console.log('[Teamnet Parser] Detected columns:', columnNames);
  }
  
  let skippedRows = 0;
  let processedRows = 0;
  
  for (const row of jsonData) {
    const firstName = getColumnValue(row, ['Name', 'name', 'First Name', 'first name']);
    const surname = getColumnValue(row, ['Surname', 'surname', 'Last Name', 'last name']);
    const dateFrom = getColumnValue(row, ['Date from', 'date from', 'Date_from', 'date_from']);
    const timeFrom = getColumnValue(row, ['Time from', 'time from', 'Time_from', 'time_from']);
    const timeTo = getColumnValue(row, ['Time to', 'time to', 'Time_to', 'time_to']);
    
    // Build employee name - handle both separate and combined name columns
    let employeeName: string;
    if (surname) {
      employeeName = `${firstName} ${surname}`.trim();
    } else {
      // Full name is already in the Name column
      employeeName = firstName;
    }
    
    // Skip rows without essential data (name can be in either format)
    if (!employeeName || !timeFrom || !timeTo) {
      skippedRows++;
      if (skippedRows <= 3) {
        console.log('[Teamnet Parser] Skipping row - missing data:', {
          name: employeeName || '(empty)',
          timeFrom: timeFrom || '(empty)',
          timeTo: timeTo || '(empty)',
          rawKeys: Object.keys(row)
        });
      }
      continue;
    }
    
    // Parse the date
    const shiftDate = parseTeamnetDate(dateFrom);
    if (!shiftDate) {
      console.warn(`[Teamnet Parser] Could not parse date: ${dateFrom} for employee ${employeeName}`);
      skippedRows++;
      continue;
    }
    
    // Track date range
    if (!earliestDate || shiftDate < earliestDate) {
      earliestDate = shiftDate;
    }
    if (!latestDate || shiftDate > latestDate) {
      latestDate = shiftDate;
    }
    
    // Calculate rate hours based on shift time
    const rateHours = calculateTeamnetRates(timeFrom, timeTo, shiftDate);
    
    // Accumulate hours by employee
    const existing = employeeMap.get(employeeName);
    if (existing) {
      existing.rate2Hours += rateHours.rate2Hours;
      existing.rate3Hours += rateHours.rate3Hours;
      existing.entries += 1;
    } else {
      employeeMap.set(employeeName, {
        employeeName,
        rate2Hours: rateHours.rate2Hours,
        rate3Hours: rateHours.rate3Hours,
        entries: 1
      });
    }
    processedRows++;
  }
  
  console.log(`[Teamnet Parser] Summary: ${processedRows} rows processed, ${skippedRows} rows skipped, ${employeeMap.size} unique employees`)
  
  // Convert accumulated data to employee details array
  // Create separate entries for Rate 2 and Rate 3 hours
  const employeeDetails: EmployeeHoursData[] = [];
  let totalRate2Hours = 0;
  let totalRate3Hours = 0;
  let totalEntries = 0;
  
  for (const [, emp] of employeeMap) {
    // Add Rate 2 entry if there are Rate 2 hours
    if (emp.rate2Hours > 0) {
      employeeDetails.push({
        employeeId: '',
        employeeName: emp.employeeName,
        extraHours: emp.rate2Hours,
        entries: emp.entries,
        rateType: 'Rate 2'
      });
      totalRate2Hours += emp.rate2Hours;
      totalEntries += emp.entries;
    }
    
    // Add Rate 3 entry if there are Rate 3 hours
    if (emp.rate3Hours > 0) {
      employeeDetails.push({
        employeeId: '',
        employeeName: emp.employeeName,
        extraHours: emp.rate3Hours,
        entries: emp.entries,
        rateType: 'Rate 3'
      });
      totalRate3Hours += emp.rate3Hours;
    }
  }
  
  // Format date range
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const formatDateISO = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };
  
  return {
    totalEntries,
    totalExtraHours: totalRate2Hours + totalRate3Hours,
    dateRange: {
      from: formatDate(earliestDate),
      to: formatDate(latestDate),
      fromISO: formatDateISO(earliestDate),
      toISO: formatDateISO(latestDate)
    },
    employeeCount: employeeMap.size,
    employeeDetails,
    totalRate2Hours,
    totalRate3Hours
  };
}

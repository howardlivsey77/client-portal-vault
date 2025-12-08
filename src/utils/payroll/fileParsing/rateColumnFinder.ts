
import { isRateDescriptionColumn } from './rateTextParser';

/**
 * Helper function to find columns that contain rate hours data
 */
export function findRateColumns(row: any): { columnName: string; rateNumber: number }[] {
  const rateColumns: { columnName: string; rateNumber: number }[] = [];
  const possibleRateColumns = Object.keys(row);
  
  for (const column of possibleRateColumns) {
    // First check for columns with "Hours" in the name (more explicit)
    if (/Rate[_\s]?1[_\s]?Hours/i.test(column) || /Hours[_\s]?Rate[_\s]?1/i.test(column)) {
      rateColumns.push({ columnName: column, rateNumber: 1 });
    } else if (/Rate[_\s]?2[_\s]?Hours/i.test(column) || /Hours[_\s]?Rate[_\s]?2/i.test(column)) {
      rateColumns.push({ columnName: column, rateNumber: 2 });
    } else if (/Rate[_\s]?3[_\s]?Hours/i.test(column) || /Hours[_\s]?Rate[_\s]?3/i.test(column)) {
      rateColumns.push({ columnName: column, rateNumber: 3 });
    } else if (/Rate[_\s]?4[_\s]?Hours/i.test(column) || /Hours[_\s]?Rate[_\s]?4/i.test(column)) {
      rateColumns.push({ columnName: column, rateNumber: 4 });
    } 
    // Then check for plain "Rate1", "Rate2", etc. columns
    else if (/^Rate[_\s]?1$/i.test(column) || /^R1$/i.test(column)) {
      rateColumns.push({ columnName: column, rateNumber: 1 });
    } else if (/^Rate[_\s]?2$/i.test(column) || /^R2$/i.test(column)) {
      rateColumns.push({ columnName: column, rateNumber: 2 });
    } else if (/^Rate[_\s]?3$/i.test(column) || /^R3$/i.test(column)) {
      rateColumns.push({ columnName: column, rateNumber: 3 });
    } else if (/^Rate[_\s]?4$/i.test(column) || /^R4$/i.test(column)) {
      rateColumns.push({ columnName: column, rateNumber: 4 });
    }
  }
  
  return rateColumns;
}

/**
 * Find pay rate description columns that contain descriptive text
 */
export function findPayRateDescriptionColumns(row: any): string[] {
  const payRateColumns: string[] = [];
  const possibleColumns = Object.keys(row);
  
  for (const column of possibleColumns) {
    if (isRateDescriptionColumn(column)) {
      payRateColumns.push(column);
    }
  }
  
  return payRateColumns;
}

/**
 * Find hours columns that might be associated with pay rate descriptions
 */
export function findHoursColumns(row: any): string[] {
  const hoursColumns: string[] = [];
  const possibleColumns = Object.keys(row);
  
  console.log("Searching for hours columns in:", possibleColumns);
  
  for (const column of possibleColumns) {
    const normalizedName = column.toLowerCase().trim();
    
    // Look for columns that contain hours/time data or numeric values
    // Include common alternative column names like "Unpaid", "Amount", "Value"
    if ((normalizedName.includes('hours') || 
         normalizedName.includes('hrs') || 
         normalizedName.includes('time') || 
         normalizedName.includes('sessions') ||
         normalizedName.includes('unpaid') ||
         normalizedName.includes('amount') ||
         normalizedName.includes('value') ||
         normalizedName.includes('duration')) && 
        !normalizedName.includes('rate') &&
        !/Rate[_\s]?\d[_\s]?Hours/i.test(column)) {
      
      console.log(`Found potential hours column: "${column}"`);
      hoursColumns.push(column);
    }
  }
  
  console.log("Hours columns found:", hoursColumns);
  return hoursColumns;
}

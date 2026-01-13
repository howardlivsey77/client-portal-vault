/**
 * Parse a date value that could be an Excel serial number or string
 */
function parseExcelDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // If it's a number, treat as Excel serial date
  if (typeof dateValue === 'number') {
    // Validate range (1 to 100000 covers dates from 1900 to ~2173)
    if (dateValue < 1 || dateValue > 100000) {
      console.warn('Excel date out of valid range:', dateValue);
      return null;
    }
    
    // Excel epoch: dates are counted from 1900-01-01
    // Excel incorrectly treats 1900 as a leap year, so adjust for dates > Feb 28, 1900 (serial 60)
    const adjustedDate = dateValue > 60 ? dateValue - 1 : dateValue;
    const msPerDay = 24 * 60 * 60 * 1000;
    const jsDate = new Date(Date.UTC(1899, 11, 30) + (adjustedDate * msPerDay));
    
    if (isNaN(jsDate.getTime())) return null;
    
    // Validate year is reasonable (1900-2100)
    const year = jsDate.getFullYear();
    if (year < 1900 || year > 2100) {
      console.warn('Parsed Excel date year out of range:', year, dateValue);
      return null;
    }
    
    return jsDate;
  }
  
  // If it's a string that looks like a number (Excel serial as string)
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    const numericValue = parseFloat(trimmed);
    
    // Check if it's a pure numeric string (Excel serial date)
    if (!isNaN(numericValue) && /^\d+(\.\d+)?$/.test(trimmed)) {
      return parseExcelDate(numericValue);
    }
    
    // Try parsing as standard date string
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      // Validate year is reasonable (1900-2100)
      const year = parsedDate.getFullYear();
      if (year < 1900 || year > 2100) {
        console.warn('Date year out of reasonable range:', year, dateValue);
        return null;
      }
      return parsedDate;
    }
    
    // Try UK format DD/MM/YYYY
    const ukMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (ukMatch) {
      const day = parseInt(ukMatch[1], 10);
      const month = parseInt(ukMatch[2], 10) - 1;
      let year = parseInt(ukMatch[3], 10);
      if (year < 100) year += 2000; // Handle 2-digit years
      
      const ukDate = new Date(year, month, day);
      if (!isNaN(ukDate.getTime()) && year >= 1900 && year <= 2100) {
        return ukDate;
      }
    }
  }
  
  return null;
}

/**
 * Extract date range from the data rows
 */
export function extractDateRange(jsonData: any[]): { earliestDate: Date | null, latestDate: Date | null } {
  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;
  
  jsonData.forEach((row: any) => {
    // Try to extract date information if available
    const dateField = row['Date'] || row['WorkDate'] || row['Work Date'] || null;
    if (dateField) {
      const currentDate = parseExcelDate(dateField);
      if (currentDate) {
        if (!earliestDate || currentDate < earliestDate) {
          earliestDate = currentDate;
        }
        if (!latestDate || currentDate > latestDate) {
          latestDate = currentDate;
        }
      }
    }
  });
  
  return { earliestDate, latestDate };
}

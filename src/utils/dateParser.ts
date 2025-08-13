/**
 * Robust date parsing utility for handling various date formats
 */

export interface ParsedDate {
  date: Date | null;
  isValid: boolean;
  error?: string;
  originalValue: any;
}

/**
 * Parse a date value from various formats including:
 * - DD/MM/YYYY or DD-MM-YYYY
 * - MM/DD/YYYY or MM-DD-YYYY  
 * - YYYY-MM-DD
 * - Excel serial numbers
 * - JavaScript Date objects
 */
export function parseDate(value: any): ParsedDate {
  const originalValue = value;
  
  // Handle null/undefined/empty values
  if (value === null || value === undefined || value === '') {
    return {
      date: null,
      isValid: false,
      error: 'Empty date value',
      originalValue
    };
  }

  // If already a Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return {
        date: null,
        isValid: false,
        error: 'Invalid Date object',
        originalValue
      };
    }
    return validateDateRange(value, originalValue);
  }

  // Handle Excel serial numbers (numbers > 25000 are likely Excel dates)
  if (typeof value === 'number' && value > 25000 && value < 100000) {
    try {
      // Excel epoch starts at January 1, 1900
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
      return validateDateRange(date, originalValue);
    } catch (error) {
      return {
        date: null,
        isValid: false,
        error: `Failed to parse Excel date: ${error}`,
        originalValue
      };
    }
  }

// Convert to string for parsing
const dateStr = String(value).trim();

if (!dateStr) {
  return {
    date: null,
    isValid: false,
    error: 'Empty date string',
    originalValue
  };
}

// Handle numeric strings that are likely Excel serial numbers (e.g., "45720" or "45720.0")
if (/^\d+(\.0+)?$/.test(dateStr)) {
  const serial = parseFloat(dateStr);
  if (serial > 25000 && serial < 100000) {
    try {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (serial - 2) * 24 * 60 * 60 * 1000);
      return validateDateRange(date, originalValue);
    } catch (error) {
      return {
        date: null,
        isValid: false,
        error: `Failed to parse Excel date string: ${error}`,
        originalValue
      };
    }
  }
}

  // Try different date formats
  const formats = [
    // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
    // MM/DD/YYYY or MM-DD-YYYY (less common, try after DD/MM/YYYY)
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
  ];

  // Try DD/MM/YYYY format first (UK format)
  const ddmmMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmMatch) {
    const day = parseInt(ddmmMatch[1], 10);
    const month = parseInt(ddmmMatch[2], 10);
    const year = parseInt(ddmmMatch[3], 10);
    
    // Create date (month is 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day);
    
    // Verify the date components match (handles invalid dates like 31/02/2023)
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return validateDateRange(date, originalValue);
    }
  }

  // Try YYYY-MM-DD format (ISO format)
  const yyyymmMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (yyyymmMatch) {
    const year = parseInt(yyyymmMatch[1], 10);
    const month = parseInt(yyyymmMatch[2], 10);
    const day = parseInt(yyyymmMatch[3], 10);
    
    const date = new Date(year, month - 1, day);
    
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return validateDateRange(date, originalValue);
    }
  }

  // Try native Date parsing as last resort
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return validateDateRange(date, originalValue);
    }
  } catch (error) {
    // Continue to error case
  }

  return {
    date: null,
    isValid: false,
    error: `Unable to parse date format: "${dateStr}"`,
    originalValue
  };
}

/**
 * Validate that the date is within a reasonable range
 */
function validateDateRange(date: Date, originalValue: any): ParsedDate {
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();
  
  // Check for reasonable year range (1900 to current year + 10)
  if (year < 1900 || year > currentYear + 10) {
    return {
      date: null,
      isValid: false,
      error: `Date year ${year} is outside reasonable range (1900-${currentYear + 10})`,
      originalValue
    };
  }

  return {
    date,
    isValid: true,
    originalValue
  };
}

/**
 * Format a date as YYYY-MM-DD for database storage
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0];
}
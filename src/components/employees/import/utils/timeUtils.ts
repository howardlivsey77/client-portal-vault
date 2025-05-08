
// Helper function to normalize and validate time strings
export const normalizeTimeString = (timeString: string | number | null | undefined): string | null => {
  // Early return for null, undefined or empty values
  if (timeString === null || timeString === undefined || timeString === '') {
    return null;
  }
  
  // Convert to string if it's a number
  const timeStrValue = typeof timeString === 'number' 
    ? timeString.toString() 
    : String(timeString); // Convert to string regardless of type
  
  // Already in 24-hour format like "09:30"
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStrValue)) {
    // Ensure leading zeros for hours
    const [hours, minutes] = timeStrValue.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Try to parse AM/PM format
  const amPmMatch = timeStrValue.match(/^(\d{1,2})(?::(\d{2}))?(?:\s*)?(am|pm|a|p)?$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2] ? parseInt(amPmMatch[2], 10) : 0;
    const ampm = (amPmMatch[3] || '').toLowerCase();
    
    // Convert to 24-hour format
    if (ampm === 'pm' || ampm === 'p') {
      if (hours < 12) hours += 12;
    } else if ((ampm === 'am' || ampm === 'a') && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // For Excel time (fraction of 24 hours)
  if (typeof timeString === 'number' || !isNaN(Number(timeStrValue))) {
    const excelTime = parseFloat(timeStrValue);
    if (excelTime >= 0 && excelTime < 1) {
      const totalMinutes = Math.round(excelTime * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  // If we can't normalize it, return the original string
  return timeStrValue;
};

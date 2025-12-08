
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
      const currentDate = new Date(dateField);
      if (!isNaN(currentDate.getTime())) {
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


// Helper function to convert Excel numeric dates to ISO date strings
export const excelDateToISO = (excelDate: number | string): string | null => {
  // If it's already a string and looks like a date string, return it
  if (typeof excelDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(excelDate) || 
        /^\d{2}\/\d{2}\/\d{4}/.test(excelDate) ||
        /^\d{2}\.\d{2}\.\d{4}/.test(excelDate)) {
      return new Date(excelDate).toISOString().split('T')[0];
    }
    return null;
  }
  
  // If it's a number, treat it as an Excel date
  if (typeof excelDate === 'number') {
    // Excel's epoch starts on 1900-01-01, but Excel incorrectly assumes 1900 is a leap year
    // So we need to adjust dates after February 28, 1900
    // Excel date 60 corresponds to February 29, 1900 which doesn't exist
    const adjustedExcelDate = excelDate > 60 ? excelDate - 1 : excelDate;
    
    // Convert Excel date to JavaScript date
    // Excel epoch is December 31, 1899
    const msPerDay = 24 * 60 * 60 * 1000;
    const jsDate = new Date(Date.UTC(1899, 11, 30) + (adjustedExcelDate * msPerDay));
    
    return jsDate.toISOString().split('T')[0];
  }
  
  return null;
};

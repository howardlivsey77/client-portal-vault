
export const calculateTotalDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
  
  return Math.max(0, diffDays);
};

export const getDefaultTotalDays = (startDate: string, endDate: string, currentTotal: number): number => {
  if (startDate && endDate && currentTotal === 0) {
    return calculateTotalDays(startDate, endDate);
  } else if (startDate && !endDate && currentTotal === 0) {
    return 1; // Default to 1 day for ongoing absence
  }
  return currentTotal;
};

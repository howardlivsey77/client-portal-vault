
export const generateHoursList = (): string[] => {
  const timeIntervals: string[] = [];
  
  // Only generate times from 6am to 10pm (6:00 to 22:00)
  for (let hour = 6; hour <= 22; hour++) {
    const hourString = hour.toString().padStart(2, '0');
    
    // Add each 15-minute interval
    timeIntervals.push(`${hourString}:00`);
    timeIntervals.push(`${hourString}:15`);
    timeIntervals.push(`${hourString}:30`);
    timeIntervals.push(`${hourString}:45`);
  }
  
  return timeIntervals;
};


/**
 * Helper function to find standard hours columns in the data
 */
export function findStandardHoursColumns(row: any): { standardHours: number, standardHoursFound: boolean } {
  const standardHourColumns = [
    'Hours', 'ExtraHours', 'Extra Hours', 'OvertimeHours', 
    'Overtime', 'hours', 'extra hours', 'TotalHours', 'Total Hours'
  ];
  
  let standardHours = 0;
  let standardHoursFound = false;
  
  for (const column of standardHourColumns) {
    if (row[column] !== undefined && !isNaN(parseFloat(row[column]))) {
      standardHours = parseFloat(row[column]);
      standardHoursFound = true;
      break;
    }
  }
  
  return { standardHours, standardHoursFound };
}

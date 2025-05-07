
import { EmployeeHoursData } from '@/components/payroll/types';
import { findRateColumns } from './rateColumnFinder';
import { findStandardHoursColumns } from './findStandardHoursColumns';
import { roundToTwoDecimals } from '@/lib/formatters';

/**
 * Extract employee hours data from parsed rows
 */
export function extractEmployeeData(jsonData: any[]): EmployeeHoursData[] {
  const employeeDetails: EmployeeHoursData[] = [];
  
  // Process each row of data
  jsonData.forEach((row: any) => {
    // Extract employee identification info
    const payrollId = row['payroll ID'] || row.EmployeeID || row.ID || '';
    const firstName = row['employee name'] || row.FirstName || row['First Name'] || '';
    const lastName = row.surname || row.LastName || row['Last Name'] || '';
    const employeeName = firstName + (lastName ? ' ' + lastName : '');
    
    // Check for rate columns using multiple naming patterns
    const rateColumns = findRateColumns(row);
    console.log("Found rate columns:", rateColumns);
    
    // Extract rates (regardless of whether they have hours)
    const rate1Value = parseFloat(row['Rate 1'] || row['Rate1'] || '0');
    const rate2Value = parseFloat(row['Rate 2'] || row['Rate2'] || '0');
    const rate3Value = parseFloat(row['Rate 3'] || row['Rate3'] || '0');
    const rate4Value = parseFloat(row['Rate 4'] || row['Rate4'] || '0');
    
    // Process each rate type that has hours
    for (const rateCol of rateColumns) {
      const hours = parseFloat(row[rateCol.columnName]);
      let rateValue = 0;
      
      // Only process if hours value is greater than 0
      if (hours > 0) {
        // Determine which rate to use based on the column name
        if (rateCol.rateNumber === 1) {
          rateValue = rate1Value;
        } else if (rateCol.rateNumber === 2) {
          rateValue = rate2Value;
        } else if (rateCol.rateNumber === 3) {
          rateValue = rate3Value;
        } else if (rateCol.rateNumber === 4) {
          rateValue = rate4Value;
        }
        
        // Add entry for this employee and rate combination
        employeeDetails.push({
          employeeId: payrollId,
          employeeName: employeeName || 'Unknown Employee',
          extraHours: roundToTwoDecimals(hours) || 0,
          entries: 1,
          rateType: `Rate ${rateCol.rateNumber}`,
          rateValue: roundToTwoDecimals(rateValue) || 0
        });
      }
    }
    
    // Check for standard hours columns as a fallback
    const { standardHours, standardHoursFound } = findStandardHoursColumns(row);
    
    // Add standard hours entry if found and greater than 0
    if (standardHoursFound && standardHours > 0) {
      employeeDetails.push({
        employeeId: payrollId,
        employeeName: employeeName || 'Unknown Employee',
        extraHours: roundToTwoDecimals(standardHours) || 0,
        entries: 1,
        rateType: 'Standard',
        rateValue: roundToTwoDecimals(rate1Value) || 0
      });
    }
  });
  
  return employeeDetails;
}

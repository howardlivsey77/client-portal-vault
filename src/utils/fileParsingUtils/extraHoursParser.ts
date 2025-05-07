
import * as XLSX from 'xlsx';
import { ExtraHoursSummary, EmployeeHoursData } from '@/components/payroll/types';
import { roundToTwoDecimals } from '@/lib/formatters';
import { findRateColumns } from './rateColumnFinder';
import { extractDateRange } from './dateExtractor';

/**
 * Parse an Excel or CSV file containing extra hours data
 */
export const parseExtraHoursFile = async (file: File): Promise<ExtraHoursSummary> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume first sheet contains the data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Parsed file data:', jsonData);
        
        // Extract employee hours data from the parsed file
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

        // Extract date range from data
        const { earliestDate, latestDate } = extractDateRange(jsonData);
        
        // Calculate totals and format the summary
        const summary = formatSummary(employeeDetails, earliestDate, latestDate);
        resolve(summary);
        
      } catch (error) {
        console.error('Error parsing file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Helper function to find standard hours columns in the data
 */
function findStandardHoursColumns(row: any): { standardHours: number, standardHoursFound: boolean } {
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

/**
 * Format the summary data for the report
 */
function formatSummary(
  employeeDetails: EmployeeHoursData[], 
  earliestDate: Date | null, 
  latestDate: Date | null
): ExtraHoursSummary {
  // Use current date range if not available in file
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  if (!earliestDate) earliestDate = oneMonthAgo;
  if (!latestDate) latestDate = today;
  
  // Calculate totals
  const totalExtraHours = roundToTwoDecimals(
    employeeDetails.reduce((sum, emp) => sum + emp.extraHours, 0)
  ) || 0;
  
  // Count total entries
  const totalEntries = employeeDetails.length;
  
  // Count unique employees
  const uniqueEmployeeIds = new Set();
  const uniqueEmployeeNames = new Set();
  
  employeeDetails.forEach(emp => {
    if (emp.employeeId) {
      uniqueEmployeeIds.add(emp.employeeId);
    } else if (emp.employeeName) {
      uniqueEmployeeNames.add(emp.employeeName);
    }
  });
  
  // Use the number of unique IDs if available, otherwise use unique names
  const uniqueCount = uniqueEmployeeIds.size > 0 ? 
    uniqueEmployeeIds.size : uniqueEmployeeNames.size;
  
  // Format date range
  const formatDateOption = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const fromDate = earliestDate ? 
    earliestDate.toLocaleDateString(undefined, formatDateOption as any) : 
    oneMonthAgo.toLocaleDateString(undefined, formatDateOption as any);
    
  const toDate = latestDate ? 
    latestDate.toLocaleDateString(undefined, formatDateOption as any) : 
    today.toLocaleDateString(undefined, formatDateOption as any);
  
  return {
    totalEntries,
    totalExtraHours,
    dateRange: {
      from: fromDate,
      to: toDate
    },
    employeeCount: uniqueCount,
    employeeDetails: employeeDetails
  };
}

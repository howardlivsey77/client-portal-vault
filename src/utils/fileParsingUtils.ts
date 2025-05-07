
import * as XLSX from 'xlsx';
import { ExtraHoursSummary, EmployeeHoursData } from '@/components/payroll/types';
import { roundToTwoDecimals } from '@/lib/formatters';

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
        let earliestDate: Date | null = null;
        let latestDate: Date | null = null;
        
        // Process each row of data
        jsonData.forEach((row: any) => {
          // Extract employee identification info
          const payrollId = row['payroll ID'] || row.EmployeeID || row.ID || '';
          const firstName = row['employee name'] || row.FirstName || '';
          const lastName = row.surname || row.LastName || '';
          const employeeName = firstName + (lastName ? ' ' + lastName : '');
          
          // Extract hours data - look for common column names
          // Try to find hours in various formats
          const hourColumns = [
            'Hours', 'ExtraHours', 'Extra Hours', 'OvertimeHours', 
            'Overtime', 'hours', 'extra hours'
          ];
          
          // Default to 0, but we'll check various columns
          let extraHours = 0;
          
          // Look for hours in any of the expected column names
          for (const column of hourColumns) {
            if (row[column] !== undefined && !isNaN(parseFloat(row[column]))) {
              extraHours = parseFloat(row[column]);
              break;
            }
          }
          
          // If no direct hours found, check for rate-specific hours
          if (extraHours === 0) {
            const rate1Hours = parseFloat(row['Rate1Hours'] || row['Hours Rate 1'] || '0');
            const rate2Hours = parseFloat(row['Rate2Hours'] || row['Hours Rate 2'] || '0');
            const rate3Hours = parseFloat(row['Rate3Hours'] || row['Hours Rate 3'] || '0');
            const rate4Hours = parseFloat(row['Rate4Hours'] || row['Hours Rate 4'] || '0');
            
            const totalRateHours = rate1Hours + rate2Hours + rate3Hours + rate4Hours;
            if (totalRateHours > 0) {
              extraHours = totalRateHours;
            }
          }
          
          // If the file only contains employee info without hours, assign a default for display
          // But we'll mark that the file doesn't have hours data
          if (isNaN(extraHours) || extraHours === 0) {
            // For employee list files, we'll still include the employee but with 0 hours
            extraHours = 0;
          }
          
          // Extract rates
          const rate1 = parseFloat(row['Rate 1'] || row['Rate1'] || '0');
          const rate2 = parseFloat(row['Rate 2'] || row['Rate2'] || '0');
          const rate3 = parseFloat(row['Rate 3'] || row['Rate3'] || '0');
          const rate4 = parseFloat(row['Rate 4'] || row['Rate4'] || '0');
          
          // Determine which rate to use
          let rateValue = rate1;
          let rateType = 'Standard';
          
          // If Rate 2 exists and is greater than 0, use that instead (assuming it's an overtime rate)
          if (rate2 > 0) {
            rateValue = rate2;
            rateType = 'Rate 2';
          }
          
          // Only add employees who have either hours or a rate
          if (extraHours > 0 || rate1 > 0 || rate2 > 0) {
            employeeDetails.push({
              employeeId: payrollId,
              employeeName: employeeName,
              extraHours: roundToTwoDecimals(extraHours) || 0,
              entries: extraHours > 0 ? 1 : 0, // Only count as entry if hours exist
              rateType: rateType,
              rateValue: roundToTwoDecimals(rateValue) || 0
            });
          }
          
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
        
        // Use current date range if not available in file
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        if (!earliestDate) earliestDate = oneMonthAgo;
        if (!latestDate) latestDate = today;
        
        // Calculate totals - only count actual hours, not zero entries
        const totalExtraHours = roundToTwoDecimals(
          employeeDetails.reduce((sum, emp) => sum + emp.extraHours, 0)
        ) || 0;
        
        // Only count entries with actual hours
        const totalEntries = employeeDetails.reduce((sum, emp) => {
          return emp.extraHours > 0 ? sum + 1 : sum;
        }, 0);
        
        // Count unique employees with actual hours
        const uniqueEmployeeIds = new Set();
        const uniqueEmployeeNames = new Set();
        
        employeeDetails.forEach(emp => {
          if (emp.extraHours > 0) {
            if (emp.employeeId) {
              uniqueEmployeeIds.add(emp.employeeId);
            } else if (emp.employeeName) {
              uniqueEmployeeNames.add(emp.employeeName);
            }
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

        // Filter out employees with zero hours for the final result
        // This ensures we only return employees with actual hours
        const employeesWithHours = employeeDetails.filter(emp => emp.extraHours > 0);
        
        resolve({
          totalEntries,
          totalExtraHours,
          dateRange: {
            from: fromDate,
            to: toDate
          },
          employeeCount: uniqueCount,
          employeeDetails: employeesWithHours
        });
        
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

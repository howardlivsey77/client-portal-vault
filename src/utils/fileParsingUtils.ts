
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
          const firstName = row['employee name'] || row.FirstName || row['First Name'] || '';
          const lastName = row.surname || row.LastName || row['Last Name'] || '';
          const employeeName = firstName + (lastName ? ' ' + lastName : '');
          
          // Look specifically for hours in Rate columns
          const rate1Hours = parseFloat(row['Rate1Hours'] || row['Rate 1 Hours'] || row['Hours Rate 1'] || row['Rate1_Hours'] || '0');
          const rate2Hours = parseFloat(row['Rate2Hours'] || row['Rate 2 Hours'] || row['Hours Rate 2'] || row['Rate2_Hours'] || '0');
          const rate3Hours = parseFloat(row['Rate3Hours'] || row['Rate 3 Hours'] || row['Hours Rate 3'] || row['Rate3_Hours'] || '0');
          const rate4Hours = parseFloat(row['Rate4Hours'] || row['Rate 4 Hours'] || row['Hours Rate 4'] || row['Rate4_Hours'] || '0');
          
          // Also check standard hour columns as a fallback
          const standardHourColumns = [
            'Hours', 'ExtraHours', 'Extra Hours', 'OvertimeHours', 
            'Overtime', 'hours', 'extra hours'
          ];
          
          let standardHours = 0;
          for (const column of standardHourColumns) {
            if (row[column] !== undefined && !isNaN(parseFloat(row[column]))) {
              standardHours = parseFloat(row[column]);
              break;
            }
          }
          
          // Calculate total hours from all sources
          const totalHours = rate1Hours + rate2Hours + rate3Hours + rate4Hours + standardHours;
          
          // Only proceed if there are actual hours
          if (totalHours > 0) {
            // Extract rates
            const rate1 = parseFloat(row['Rate 1'] || row['Rate1'] || '0');
            const rate2 = parseFloat(row['Rate 2'] || row['Rate2'] || '0');
            const rate3 = parseFloat(row['Rate 3'] || row['Rate3'] || '0');
            const rate4 = parseFloat(row['Rate 4'] || row['Rate4'] || '0');
            
            // Determine rate to use based on which hours column has values
            let rateValue = 0;
            let rateType = '';
            let specificHours = 0;
            
            if (rate1Hours > 0) {
              rateValue = rate1;
              rateType = 'Rate 1';
              specificHours = rate1Hours;
            } else if (rate2Hours > 0) {
              rateValue = rate2;
              rateType = 'Rate 2';
              specificHours = rate2Hours;
            } else if (rate3Hours > 0) {
              rateValue = rate3;
              rateType = 'Rate 3';
              specificHours = rate3Hours;
            } else if (rate4Hours > 0) {
              rateValue = rate4;
              rateType = 'Rate 4';
              specificHours = rate4Hours;
            } else {
              rateValue = rate1;
              rateType = 'Standard';
              specificHours = standardHours;
            }
            
            // Add entry for this employee and rate combination
            employeeDetails.push({
              employeeId: payrollId,
              employeeName: employeeName || 'Unknown Employee',
              extraHours: roundToTwoDecimals(specificHours) || 0,
              entries: 1,
              rateType: rateType,
              rateValue: roundToTwoDecimals(rateValue) || 0
            });
            
            // Handle multiple rate entries for the same employee
            if (rate1Hours > 0 && rateType !== 'Rate 1') {
              employeeDetails.push({
                employeeId: payrollId,
                employeeName: employeeName || 'Unknown Employee',
                extraHours: roundToTwoDecimals(rate1Hours) || 0,
                entries: 1,
                rateType: 'Rate 1',
                rateValue: roundToTwoDecimals(rate1) || 0
              });
            }
            
            if (rate2Hours > 0 && rateType !== 'Rate 2') {
              employeeDetails.push({
                employeeId: payrollId,
                employeeName: employeeName || 'Unknown Employee',
                extraHours: roundToTwoDecimals(rate2Hours) || 0,
                entries: 1,
                rateType: 'Rate 2',
                rateValue: roundToTwoDecimals(rate2) || 0
              });
            }
            
            if (rate3Hours > 0 && rateType !== 'Rate 3') {
              employeeDetails.push({
                employeeId: payrollId,
                employeeName: employeeName || 'Unknown Employee',
                extraHours: roundToTwoDecimals(rate3Hours) || 0,
                entries: 1,
                rateType: 'Rate 3',
                rateValue: roundToTwoDecimals(rate3) || 0
              });
            }
            
            if (rate4Hours > 0 && rateType !== 'Rate 4') {
              employeeDetails.push({
                employeeId: payrollId,
                employeeName: employeeName || 'Unknown Employee',
                extraHours: roundToTwoDecimals(rate4Hours) || 0,
                entries: 1,
                rateType: 'Rate 4',
                rateValue: roundToTwoDecimals(rate4) || 0
              });
            }
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
        
        resolve({
          totalEntries,
          totalExtraHours,
          dateRange: {
            from: fromDate,
            to: toDate
          },
          employeeCount: uniqueCount,
          employeeDetails: employeeDetails
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

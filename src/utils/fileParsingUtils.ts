
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
          // Example mappings - adjust these based on your actual file structure
          const employeeName = row.Employee || row.EmployeeName || row['Employee Name'] || '';
          const employeeId = row.EmployeeID || row.ID || '';
          const extraHours = parseFloat(row.Hours || row.ExtraHours || '0');
          const entries = 1; // Default to 1 entry per row
          const rateType = row.RateType || 'Standard';
          const rateValue = parseFloat(row.Rate || row.HourlyRate || '0');
          
          // Process date if available
          const dateValue = row.Date || row.WorkDate;
          if (dateValue) {
            let date: Date;
            
            // Handle Excel numeric dates
            if (typeof dateValue === 'number') {
              // Excel dates are stored as days since 1900-01-01
              const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
              date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
              
              // Adjust for Excel's leap year bug (1900 wasn't a leap year)
              if (dateValue >= 60) {
                date = new Date(date.getTime() - 24 * 60 * 60 * 1000);
              }
            } else {
              // Handle string dates
              date = new Date(dateValue);
            }
            
            if (!isNaN(date.getTime())) {
              if (!earliestDate || date < earliestDate) earliestDate = date;
              if (!latestDate || date > latestDate) latestDate = date;
            }
          }
          
          employeeDetails.push({
            employeeId,
            employeeName,
            extraHours: roundToTwoDecimals(extraHours) || 0,
            entries,
            rateType,
            rateValue: roundToTwoDecimals(rateValue) || 0
          });
        });
        
        // Calculate totals
        const totalExtraHours = roundToTwoDecimals(
          employeeDetails.reduce((sum, emp) => sum + emp.extraHours, 0)
        ) || 0;
        
        const totalEntries = employeeDetails.reduce((sum, emp) => sum + emp.entries, 0);
        
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
          new Date().toLocaleDateString(undefined, formatDateOption as any);
          
        const toDate = latestDate ? 
          latestDate.toLocaleDateString(undefined, formatDateOption as any) : 
          new Date().toLocaleDateString(undefined, formatDateOption as any);
        
        resolve({
          totalEntries,
          totalExtraHours,
          dateRange: {
            from: fromDate,
            to: toDate
          },
          employeeCount: uniqueCount,
          employeeDetails
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

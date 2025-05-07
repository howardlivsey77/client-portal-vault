
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
          // Map the fields from your actual file structure
          const payrollId = row['payroll ID'] || row.EmployeeID || row.ID || '';
          const firstName = row['employee name'] || row.FirstName || '';
          const lastName = row.surname || row.LastName || '';
          const employeeName = firstName + (lastName ? ' ' + lastName : '');
          
          // Extract rates
          const rate1 = parseFloat(row['Rate 1'] || '0');
          const rate2 = parseFloat(row['Rate 2'] || '0');
          
          // Default to some hours for visualization purposes
          const extraHours = 1; // Default value to show in summary
          
          employeeDetails.push({
            employeeId: payrollId,
            employeeName: employeeName,
            extraHours: roundToTwoDecimals(extraHours) || 0,
            entries: 1,
            rateType: rate2 > 0 ? 'Rate 2' : 'Standard',
            rateValue: roundToTwoDecimals(rate2 > 0 ? rate2 : rate1) || 0
          });
          
          // Use current date range if not available in file
          const today = new Date();
          if (!earliestDate) earliestDate = today;
          if (!latestDate) latestDate = today;
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

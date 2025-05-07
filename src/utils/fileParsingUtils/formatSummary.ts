
import { ExtraHoursSummary, EmployeeHoursData } from '@/components/payroll/types';
import { roundToTwoDecimals } from '@/lib/formatters';

/**
 * Format the summary data for the report
 */
export function formatSummary(
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

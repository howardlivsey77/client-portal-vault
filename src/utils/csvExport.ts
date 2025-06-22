
import { ExtraHoursSummary } from '@/components/payroll/types';
import { formatCurrency, formatDate } from '@/lib/formatters';

/**
 * Generate a CSV from the extra hours summary data
 */
export const generateExtraHoursCSV = (summary: ExtraHoursSummary, filename = 'extra-hours-summary.csv') => {
  // Create CSV content
  const csvRows: string[] = [];
  
  // Add header information
  csvRows.push('Extra Hours Summary Report');
  csvRows.push(`Period,${summary.dateRange.from} - ${summary.dateRange.to}`);
  csvRows.push(`Generated on,${formatDate(new Date())}`);
  csvRows.push(''); // Empty row for spacing
  
  // Add summary statistics
  csvRows.push('Summary Statistics');
  csvRows.push('Total Extra Hours,Total Entries,Employee Count');
  csvRows.push(`${summary.totalExtraHours},${summary.totalEntries},${summary.employeeCount}`);
  csvRows.push(''); // Empty row for spacing
  
  // Add employee details header
  csvRows.push('Employee Details');
  csvRows.push('Payroll ID,Employee Name,Rate Type,Hourly Rate,Extra Hours,Total Amount');
  
  // Add employee data
  summary.employeeDetails.forEach(employee => {
    const row = [
      employee.payrollId || 'N/A',
      employee.employeeName || 'Unknown',
      employee.rateType || 'Standard',
      employee.rateValue ? formatCurrency(employee.rateValue) : 'N/A',
      employee.extraHours.toString(),
      employee.rateValue 
        ? formatCurrency(employee.rateValue * employee.extraHours) 
        : 'N/A'
    ];
    
    // Escape commas and quotes in CSV data
    const escapedRow = row.map(field => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    });
    
    csvRows.push(escapedRow.join(','));
  });
  
  // Create CSV content
  const csvContent = csvRows.join('\n');
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ExtraHoursSummary } from '@/components/payroll/types';

/**
 * Generate a PDF from the extra hours summary data
 */
export const generateExtraHoursPDF = (summary: ExtraHoursSummary, filename = 'extra-hours-summary.pdf') => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Extra Hours Summary', 14, 20);
  
  // Add date range
  doc.setFontSize(10);
  doc.text(`Period: ${summary.dateRange.from} - ${summary.dateRange.to}`, 14, 30);
  
  // Add summary section
  doc.setFontSize(12);
  doc.text('Summary', 14, 40);
  
  // Create summary table
  // Using a fixed position for the next section since autoTable doesn't return an object with finalY
  autoTable(doc, {
    startY: 45,
    head: [['Total Hours', 'Total Entries', 'Employee Count']],
    body: [
      [
        summary.totalExtraHours.toString(), 
        summary.totalEntries.toString(), 
        summary.employeeCount.toString()
      ]
    ]
  });
  
  // Use a fixed position that would be below the summary table
  const summaryTableEndY = 70;
  
  // Add employee details section
  doc.setFontSize(12);
  doc.text('Employee Details', 14, summaryTableEndY + 15);
  
  // Create employee details table
  const tableData = summary.employeeDetails.map(employee => [
    employee.employeeId || 'N/A',
    employee.employeeName || 'Unknown',
    employee.rateType || 'Standard',
    employee.rateValue ? formatCurrency(employee.rateValue) : 'N/A',
    employee.extraHours.toString(),
    employee.rateValue 
      ? formatCurrency(employee.rateValue * employee.extraHours) 
      : 'N/A'
  ]);
  
  // Add the employee details table
  autoTable(doc, {
    startY: summaryTableEndY + 20,
    head: [['Payroll ID', 'Employee', 'Rate Type', 'Hourly Rate', 'Extra Hours', 'Total']],
    body: tableData
  });
  
  // Add generation date at the bottom
  const now = new Date();
  doc.setFontSize(8);
  doc.text(`Generated on ${formatDate(now)}`, 14, doc.internal.pageSize.height - 10);
  
  // Save the PDF
  doc.save(filename);
};

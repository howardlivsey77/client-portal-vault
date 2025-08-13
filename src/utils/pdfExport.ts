
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ExtraHoursSummary } from '@/components/payroll/types';
import { SicknessRecord, SicknessEntitlementSummary } from '@/types/sickness';
import { Employee } from '@/types/employee-types';

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
    employee.payrollId || 'N/A',
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

/**
 * Generate a PDF sickness report for an employee
 */
export const generateSicknessReportPDF = (
  employee: Employee,
  sicknessRecords: SicknessRecord[],
  entitlementSummary: SicknessEntitlementSummary | null,
  filename = 'sickness-report.pdf'
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Sickness Report', 14, 20);
  
  // Employee details
  doc.setFontSize(12);
  doc.text(`Employee: ${employee.first_name} ${employee.last_name}`, 14, 35);
  if (employee.payroll_id) {
    doc.text(`Payroll ID: ${employee.payroll_id}`, 14, 45);
  }
  doc.text(`Report Date: ${formatDate(new Date())}`, 14, 55);
  
  let currentY = 70;
  
  // Entitlement Summary Section
  if (entitlementSummary) {
    doc.setFontSize(14);
    doc.text('Entitlement Summary', 14, currentY);
    currentY += 10;
    
    // Service information
    doc.setFontSize(10);
    doc.text(`Service Months: ${entitlementSummary.service_months}`, 14, currentY);
    doc.text(`Current Tier: ${entitlementSummary.current_tier}`, 14, currentY + 10);
    doc.text(`Rolling Period: ${formatDate(entitlementSummary.rolling_period_start)} - ${formatDate(entitlementSummary.rolling_period_end)}`, 14, currentY + 20);
    currentY += 35;
    
    // Entitlement table
    autoTable(doc, {
      startY: currentY,
      head: [['Pay Type', 'Used (Current Year)', 'Used (Rolling 12m)', 'Remaining', 'Opening Balance']],
      body: [
        [
          'Full Pay',
          `${entitlementSummary.full_pay_used} days`,
          `${entitlementSummary.full_pay_used_rolling_12_months} days`,
          `${entitlementSummary.full_pay_remaining} days`,
          `${entitlementSummary.opening_balance_full_pay} days`
        ],
        [
          'Half Pay',
          `${entitlementSummary.half_pay_used} days`,
          `${entitlementSummary.half_pay_used_rolling_12_months} days`,
          `${entitlementSummary.half_pay_remaining} days`,
          `${entitlementSummary.opening_balance_half_pay} days`
        ]
      ]
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 20;
  }
  
  // Sickness Records Section
  doc.setFontSize(14);
  doc.text('Sickness Records', 14, currentY);
  currentY += 10;
  
  if (sicknessRecords.length === 0) {
    doc.setFontSize(10);
    doc.text('No sickness records found', 14, currentY);
  } else {
    // Records table
    const tableData = sicknessRecords.map(record => [
      formatDate(record.start_date),
      record.end_date ? formatDate(record.end_date) : 'Ongoing',
      `${record.total_days} days`,
      record.is_certified ? 'Yes' : 'No',
      record.reason || 'Not specified',
      record.notes || '-'
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Start Date', 'End Date', 'Duration', 'Certified', 'Reason', 'Notes']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        4: { cellWidth: 25 }, // Reason column
        5: { cellWidth: 30 }  // Notes column
      }
    });
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(`Generated on ${formatDate(new Date())}`, 14, pageHeight - 10);
  
  // Save the PDF
  doc.save(filename);
};

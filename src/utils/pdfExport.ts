
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
 * Helper function to convert image URL to base64 data URL with dimensions
 */
const loadImageAsBase64 = async (url: string): Promise<{ 
  data: string; 
  format: string; 
  width: number; 
  height: number; 
  aspectRatio: number; 
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Detect format from URL or default to PNG for better quality
      const format = url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg') ? 'JPEG' : 'PNG';
      const dataURL = canvas.toDataURL(`image/${format.toLowerCase()}`);
      
      resolve({ 
        data: dataURL, 
        format,
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Calculate optimal logo size maintaining aspect ratio
 */
const calculateLogoSize = (originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number) => {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if too wide
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  // Scale down if too tall
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width, height };
};

/**
 * Helper function to check if a sickness record is within the rolling 12-month entitlement period
 */
const isRecordWithinEntitlementPeriod = (record: SicknessRecord, entitlementSummary: SicknessEntitlementSummary | null): boolean => {
  if (!entitlementSummary) return true; // If no summary, treat all records as current
  
  const recordStart = new Date(record.start_date);
  const recordEnd = new Date(record.end_date || record.start_date);
  const rangeStart = new Date(entitlementSummary.rolling_period_start);
  const rangeEnd = new Date(entitlementSummary.rolling_period_end);
  
  // Record overlaps with entitlement period if recordStart <= rangeEnd and recordEnd >= rangeStart
  return recordStart <= rangeEnd && recordEnd >= rangeStart;
};

/**
 * Generate a PDF sickness report for an employee
 */
export const generateSicknessReportPDF = async (
  employee: Employee,
  sicknessRecords: SicknessRecord[],
  entitlementSummary: SicknessEntitlementSummary | null,
  companyLogoUrl?: string | null,
  filename = 'sickness-report.pdf'
) => {
  const doc = new jsPDF();
  
  // Add company logo if available
  if (companyLogoUrl) {
    try {
      const { data, format, width, height } = await loadImageAsBase64(companyLogoUrl);
      
      // Define maximum logo constraints (in mm)
      const maxLogoWidth = 40;
      const maxLogoHeight = 20;
      
      // Calculate optimal size maintaining aspect ratio
      const { width: logoWidth, height: logoHeight } = calculateLogoSize(
        width, 
        height, 
        maxLogoWidth, 
        maxLogoHeight
      );
      
      // Position logo in top right corner with proper spacing
      const pageWidth = doc.internal.pageSize.width;
      const logoX = pageWidth - logoWidth - 14; // 14mm from right edge
      
      doc.addImage(data, format, logoX, 10, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Could not add logo to PDF:', error);
    }
  }
  
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
      head: [['Pay Type', 'Used (Rolling 12m)', 'Remaining']],
      body: [
        [
          'Full Pay',
          `${entitlementSummary.full_pay_used_rolling_12_months} days`,
          `${entitlementSummary.full_pay_remaining} days`
        ],
        [
          'Half Pay',
          `${entitlementSummary.half_pay_used_rolling_12_months} days`,
          `${entitlementSummary.half_pay_remaining} days`
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
    // Separate current and expired records for legend
    const currentRecords = sicknessRecords.filter(record => isRecordWithinEntitlementPeriod(record, entitlementSummary));
    const expiredRecords = sicknessRecords.filter(record => !isRecordWithinEntitlementPeriod(record, entitlementSummary));
    
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
        4: { cellWidth: 30 }, // Reason column
        5: { cellWidth: 35 }  // Notes column
      },
      didParseCell: (data) => {
        // Apply strikethrough styling to expired records
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const record = sicknessRecords[rowIndex];
          
          if (!isRecordWithinEntitlementPeriod(record, entitlementSummary)) {
            // Apply strikethrough and muted styling for expired records
            data.cell.styles.textColor = [128, 128, 128]; // Gray text
            data.cell.styles.fontStyle = 'italic';
            
            // Add strikethrough effect by drawing a line
            if (data.cell.raw) {
              const originalText = data.cell.text;
              data.cell.text = originalText; // Keep original text, we'll add line in willDrawCell
            }
          }
        }
      },
      willDrawCell: (data) => {
        // Draw strikethrough line for expired records
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const record = sicknessRecords[rowIndex];
          
          if (!isRecordWithinEntitlementPeriod(record, entitlementSummary)) {
            const { x, y, width, height } = data.cell;
            const centerY = y + height / 2;
            
            // Draw strikethrough line
            doc.setDrawColor(128, 128, 128);
            doc.setLineWidth(0.3);
            doc.line(x + 1, centerY, x + width - 1, centerY);
          }
        }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Add legend if there are expired records
    if (expiredRecords.length > 0 && entitlementSummary) {
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Note: Records with strikethrough are outside the current entitlement period', 14, currentY);
      doc.text(`(${formatDate(entitlementSummary.rolling_period_start)} - ${formatDate(entitlementSummary.rolling_period_end)})`, 14, currentY + 8);
      doc.text(`${expiredRecords.length} of ${sicknessRecords.length} records are historical and not counted in current entitlements.`, 14, currentY + 16);
      doc.setTextColor(0, 0, 0); // Reset to black
    }
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text(`Generated on ${formatDate(new Date())}`, 14, pageHeight - 10);
  
  // Save the PDF
  doc.save(filename);
};

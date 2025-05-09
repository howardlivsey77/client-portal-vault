
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollResult } from '@/services/payroll/ukPayrollCalculator';
import { formatCurrency, formatDate } from '@/lib/formatters';

/**
 * Generate a PDF payslip from the payroll calculation data
 */
export const generatePayslip = (payrollData: PayrollResult, period: string, filename = 'payslip.pdf') => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add company header (placeholder)
  doc.setFontSize(18);
  doc.text('COMPANY NAME', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Payslip', 105, 28, { align: 'center' });
  
  // Employee details section
  doc.setFontSize(11);
  doc.text(`Employee: ${payrollData.employeeName}`, 14, 40);
  if (payrollData.payrollId) {
    doc.text(`Payroll ID: ${payrollData.payrollId}`, 14, 46);
  }
  doc.text(`Pay Period: ${period}`, 14, 52);
  
  // Summary info on the right
  doc.text(`Date: ${formatDate(new Date())}`, 140, 40);
  doc.text(`Gross Pay: ${formatCurrency(payrollData.grossPay)}`, 140, 46);
  doc.text(`Net Pay: ${formatCurrency(payrollData.netPay)}`, 140, 52);
  
  // Create earnings table
  doc.setFontSize(12);
  doc.text('Earnings', 14, 65);
  
  autoTable(doc, {
    startY: 68,
    head: [['Description', 'Amount']],
    body: [
      ['Basic Salary', formatCurrency(payrollData.grossPay)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
    columnStyles: {
      1: { halign: 'right' }
    }
  });
  
  // Create deductions table
  const deductionsY = (doc as any).lastAutoTable.finalY + 10;
  doc.text('Deductions', 14, deductionsY);
  
  const deductionsData = [
    ['Income Tax', formatCurrency(payrollData.incomeTax)],
    ['National Insurance', formatCurrency(payrollData.nationalInsurance)]
  ];
  
  if (payrollData.pensionContribution > 0) {
    deductionsData.push(['Pension Contribution', formatCurrency(payrollData.pensionContribution)]);
  }
  
  if (payrollData.studentLoan > 0) {
    deductionsData.push(['Student Loan', formatCurrency(payrollData.studentLoan)]);
  }
  
  payrollData.additionalDeductions.forEach(deduction => {
    deductionsData.push([deduction.description, formatCurrency(deduction.amount)]);
  });
  
  autoTable(doc, {
    startY: deductionsY + 3,
    head: [['Description', 'Amount']],
    body: deductionsData,
    theme: 'grid',
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
    columnStyles: {
      1: { halign: 'right' }
    }
  });
  
  // Create allowances table if there are any
  if (payrollData.additionalAllowances.length > 0) {
    const allowancesY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Allowances', 14, allowancesY);
    
    const allowancesData = payrollData.additionalAllowances.map(allowance => [
      allowance.description, formatCurrency(allowance.amount)
    ]);
    
    autoTable(doc, {
      startY: allowancesY + 3,
      head: [['Description', 'Amount']],
      body: allowancesData,
      theme: 'grid',
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      columnStyles: {
        1: { halign: 'right' }
      }
    });
  }
  
  // Create summary table
  const summaryY = (doc as any).lastAutoTable.finalY + 10;
  
  autoTable(doc, {
    startY: summaryY,
    body: [
      ['Gross Pay', formatCurrency(payrollData.grossPay)],
      ['Total Deductions', formatCurrency(payrollData.totalDeductions)],
      ['Total Allowances', formatCurrency(payrollData.totalAllowances)],
      ['Net Pay', formatCurrency(payrollData.netPay)]
    ],
    theme: 'grid',
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' }
    },
    bodyStyles: { fontSize: 11 },
    styles: { cellPadding: 4 },
  });
  
  // Add footer note
  doc.setFontSize(8);
  doc.text('This payslip was generated automatically and does not require a signature.', 105, doc.internal.pageSize.height - 10, { align: 'center' });
  
  // Save the PDF
  doc.save(filename);
};

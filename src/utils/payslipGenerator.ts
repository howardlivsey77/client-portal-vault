
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PayrollResult } from "@/services/payroll/types";

/**
 * Generate a PDF payslip for an employee
 */
export function generatePayslip(
  payrollData: PayrollResult, 
  payPeriod: string,
  filename: string
) {
  const doc = new jsPDF();
  doc.setFont("helvetica");
  
  // Add company letterhead
  doc.setFontSize(16);
  doc.text("UK PAYROLL SYSTEM", 105, 20, { align: "center" });
  
  // Add payslip title
  doc.setFontSize(14);
  doc.text(`PAYSLIP - ${payPeriod}`, 105, 30, { align: "center" });
  
  // Add horizontal divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 32, 190, 32);
  
  // Add employee information
  doc.setFontSize(11);
  doc.text("Employee:", 20, 40);
  doc.setFont("helvetica", "bold");
  doc.text(payrollData.employeeName, 55, 40);
  doc.setFont("helvetica", "normal");
  
  if (payrollData.payrollId) {
    doc.text("Employee ID:", 20, 47);
    doc.setFont("helvetica", "bold");
    doc.text(payrollData.payrollId, 55, 47);
    doc.setFont("helvetica", "normal");
  }
  
  // Right side info
  doc.text("Tax Code:", 120, 40);
  doc.setFont("helvetica", "bold");
  doc.text(payrollData.taxCode, 155, 40);
  doc.setFont("helvetica", "normal");
  
  doc.text("Tax Period:", 120, 47);
  doc.setFont("helvetica", "bold");
  doc.text(`${payrollData.taxPeriod || 1} (${payrollData.taxYear || '2025-2026'})`, 155, 47);
  doc.setFont("helvetica", "normal");
  
  // Add horizontal divider
  doc.line(20, 52, 190, 52);
  
  // Payments table
  autoTable(doc, {
    startY: 55,
    head: [['Payments', 'Amount', 'YTD']],
    body: [
      ['Basic Salary', `£${payrollData.monthlySalary.toFixed(2)}`, `£${(payrollData.grossPayYTD || 0).toFixed(2)}`],
      ...(payrollData.additionalEarnings.map(earning => 
        [earning.name, `£${earning.amount.toFixed(2)}`, '']
      )),
      ['Total Gross Pay', `£${payrollData.grossPay.toFixed(2)}`, `£${(payrollData.grossPayYTD || 0).toFixed(2)}`]
    ],
    headStyles: { fillColor: [70, 70, 70] },
    styles: { textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' }
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 55, left: 20, right: 20 }
  });
  
  // Get position after the first table
  const finalY = (doc as any).lastAutoTable.finalY;
  
  // Deductions table
  autoTable(doc, {
    startY: finalY + 10,
    head: [['Deductions', 'Amount', 'YTD']],
    body: [
      ['Income Tax', `£${payrollData.incomeTax.toFixed(2)}`, `£${(payrollData.incomeTaxYTD || 0).toFixed(2)}`],
      ['National Insurance', `£${payrollData.nationalInsurance.toFixed(2)}`, `£${(payrollData.nationalInsuranceYTD || 0).toFixed(2)}`],
      ...(payrollData.studentLoan > 0 ? [['Student Loan', `£${payrollData.studentLoan.toFixed(2)}`, '']] : []),
      ...(payrollData.pensionContribution > 0 ? [['Pension', `£${payrollData.pensionContribution.toFixed(2)}`, '']] : []),
      ...(payrollData.additionalDeductions.map(deduction => 
        [deduction.name, `£${deduction.amount.toFixed(2)}`, '']
      )),
      ['Total Deductions', `£${payrollData.totalDeductions.toFixed(2)}`, '']
    ],
    headStyles: { fillColor: [70, 70, 70] },
    styles: { textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' }
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 55, left: 20, right: 20 }
  });
  
  // Get position after the second table
  const finalY2 = (doc as any).lastAutoTable.finalY;
  
  // Net Pay box
  autoTable(doc, {
    startY: finalY2 + 10,
    head: [['Net Pay', `£${payrollData.netPay.toFixed(2)}`]],
    body: [],
    headStyles: { fillColor: [50, 50, 50], fontSize: 12, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 80, halign: 'right' }
    },
    margin: { top: 55, left: 20, right: 20 }
  });
  
  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("This payslip was generated automatically and does not require a signature.", 105, 280, { align: "center" });
  
  // Save the PDF
  doc.save(filename);
}


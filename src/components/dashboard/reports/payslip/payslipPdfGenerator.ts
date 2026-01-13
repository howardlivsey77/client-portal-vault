import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PayslipData, CompanyDetails, PayslipGeneratorOptions } from "./types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { loadImageAsBase64, getImageDimensions } from "@/utils/payroll/imageLoader";

/**
 * Generate a professional PDF payslip matching the reference design
 */
export async function generatePayslipPdf(options: PayslipGeneratorOptions): Promise<void> {
  const { payslipData, company } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Load company logo if available
  let logoBase64: string | null = null;
  let logoDimensions = { width: 0, height: 0 };

  if (company.logoUrl) {
    logoBase64 = await loadImageAsBase64(company.logoUrl);
    if (logoBase64) {
      logoDimensions = await getImageDimensions(logoBase64);
    }
  }

  // Header
  const headerY = 15;

  // Employee name and period (left)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(payslipData.employeeName, 14, headerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Month ${payslipData.periodNumber}`, 14 + doc.getTextWidth(payslipData.employeeName) + 5, headerY);

  // Company logo/name (right)
  if (logoBase64 && logoDimensions.width > 0) {
    const maxLogoWidth = 50;
    const maxLogoHeight = 15;
    const aspectRatio = logoDimensions.width / logoDimensions.height;
    let logoWidth = maxLogoWidth;
    let logoHeight = logoWidth / aspectRatio;

    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = logoHeight * aspectRatio;
    }

    const logoX = pageWidth - 14 - logoWidth;
    doc.addImage(logoBase64, "PNG", logoX, headerY - 10, logoWidth, logoHeight);
  } else {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246); // Primary blue
    doc.text(company.name, pageWidth - 14, headerY, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, headerY + 8, pageWidth - 14, headerY + 8);

  // Section titles
  const sectionY = headerY + 18;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Details", 14, sectionY);
  doc.text("Payments", 80, sectionY);
  doc.text("Deductions", 145, sectionY);

  // Employee Details Table
  const employeeDetailsData: string[][] = [];
  
  const addressLines = [
    payslipData.address?.line1,
    payslipData.address?.line2,
    payslipData.address?.line3,
    payslipData.address?.line4,
    payslipData.address?.postcode,
  ].filter(Boolean);

  if (addressLines.length > 0) {
    employeeDetailsData.push(["Address", addressLines.join("\n")]);
  }
  if (payslipData.payrollId) {
    employeeDetailsData.push(["Works number", payslipData.payrollId]);
  }
  if (payslipData.department) {
    employeeDetailsData.push(["Department", payslipData.department]);
  }
  employeeDetailsData.push(["Tax code", payslipData.taxCode]);
  if (payslipData.niNumber) {
    employeeDetailsData.push(["National Insurance number", payslipData.niNumber]);
  }
  if (payslipData.niTable) {
    employeeDetailsData.push(["National Insurance table", payslipData.niTable]);
  }

  autoTable(doc, {
    startY: sectionY + 3,
    body: employeeDetailsData,
    theme: "grid",
    tableWidth: 60,
    margin: { left: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 30, textColor: [100, 100, 100] },
      1: { cellWidth: 30, fontStyle: "bold", halign: "right" },
    },
  });
  const employeeTableFinalY = (doc as any).lastAutoTable.finalY;
  // Payments Table
  const paymentsData = payslipData.payments.map((p) => [p.description, formatCurrency(p.amount)]);
  
  // Add sickness note after Basic Salary if present
  if (payslipData.sicknessNote && paymentsData.length > 0) {
    paymentsData.splice(1, 0, [`  (${payslipData.sicknessNote})`, '']);
  }
  
  paymentsData.push(["Total", formatCurrency(payslipData.grossPay)]);

  autoTable(doc, {
    startY: sectionY + 3,
    body: paymentsData,
    theme: "grid",
    tableWidth: 55,
    margin: { left: 80 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      const totalRowIndex = paymentsData.length - 1;
      const sicknessNoteRowIndex = payslipData.sicknessNote ? 1 : -1;
      
      if (data.row.index === totalRowIndex) {
        data.cell.styles.fillColor = [245, 245, 245];
        data.cell.styles.fontStyle = "italic";
      }
      // Style the sickness note row
      if (data.row.index === sicknessNoteRowIndex) {
        data.cell.styles.fontStyle = "italic";
        data.cell.styles.textColor = [100, 100, 100];
        data.cell.styles.fontSize = 7;
      }
    },
  });
  const paymentsTableFinalY = (doc as any).lastAutoTable.finalY;

  // Deductions Table
  const deductionsData = payslipData.deductions.map((d) => [d.description, formatCurrency(d.amount)]);
  deductionsData.push(["Total", formatCurrency(payslipData.totalDeductions)]);

  autoTable(doc, {
    startY: sectionY + 3,
    body: deductionsData,
    theme: "grid",
    tableWidth: 55,
    margin: { left: 145 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.row.index === deductionsData.length - 1) {
        data.cell.styles.fillColor = [245, 245, 245];
        data.cell.styles.fontStyle = "italic";
      }
    },
  });
  const deductionsTableFinalY = (doc as any).lastAutoTable.finalY;

  // Bottom section - use the maximum Y position from all three tables
  const maxTableY = Math.max(employeeTableFinalY, paymentsTableFinalY, deductionsTableFinalY);
  const bottomY = maxTableY + 20;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, bottomY - 5, pageWidth - 14, bottomY - 5);

  // This Month
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("This Month", 14, bottomY);

  autoTable(doc, {
    startY: bottomY + 3,
    body: [
      ["Taxable gross pay", formatCurrency(payslipData.thisPeriod.taxableGrossPay)],
      ["Employer National Insurance", formatCurrency(payslipData.thisPeriod.employerNI)],
    ],
    theme: "plain",
    tableWidth: 55,
    margin: { left: 14 },
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20, halign: "right", fontStyle: "bold" },
    },
  });

  // Year to Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Year to Date", 80, bottomY);

  const ytdData: string[][] = [
    ["Taxable gross pay", formatCurrency(payslipData.yearToDate.taxableGrossPay)],
    ["Tax", formatCurrency(payslipData.yearToDate.tax)],
    ["Employee National Insurance", formatCurrency(payslipData.yearToDate.employeeNI)],
  ];
  
  if (payslipData.yearToDate.employeePension > 0) {
    ytdData.push(["Employee pension", formatCurrency(payslipData.yearToDate.employeePension)]);
  }
  if (payslipData.yearToDate.employerPension > 0) {
    ytdData.push(["Employer pension", formatCurrency(payslipData.yearToDate.employerPension)]);
  }

  autoTable(doc, {
    startY: bottomY + 3,
    body: ytdData,
    theme: "plain",
    tableWidth: 55,
    margin: { left: 80 },
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20, halign: "right", fontStyle: "bold" },
    },
  });

  // Payment
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Payment", 155, bottomY);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(payslipData.netPay), pageWidth - 14, bottomY + 15, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Paid ${formatDate(payslipData.paymentDate)}`, pageWidth - 14, bottomY + 22, { align: "right" });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

  const companyAddressParts = [
    company.name,
    company.payeRef && `(${company.payeRef})`,
    company.addressLine1,
    company.addressLine2,
    company.addressLine3,
    company.postCode,
  ].filter(Boolean);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(company.name, 14, footerY);
  doc.setFont("helvetica", "normal");
  const restOfAddress = companyAddressParts.slice(1).join(", ");
  doc.text(restOfAddress, 14 + doc.getTextWidth(company.name + " "), footerY);

  // Save the PDF
  const filename = `payslip_${payslipData.employeeName.replace(/\s+/g, "_")}_month_${payslipData.periodNumber}.pdf`;
  doc.save(filename);
}

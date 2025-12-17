import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { P11ReportData } from "@/hooks/reports/useP11Report";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";

export async function generateP11Pdf(data: P11ReportData): Promise<void> {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const formatValue = (value: number) => {
    if (value === 0) return "-";
    return formatCurrency(value / 100);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("P11 Deductions Working Sheet", 14, 15);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tax Year: ${data.taxYear}`, 14, 22);

  // Company info (right)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.company.name, pageWidth - 14, 15, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (data.company.payeRef) {
    doc.text(`PAYE Ref: ${data.company.payeRef}`, pageWidth - 14, 21, { align: "right" });
  }

  // Employee details row
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const employeeY = 30;
  doc.text(`Employee: ${data.employee.firstName} ${data.employee.lastName}`, 14, employeeY);
  doc.text(`NI Number: ${data.employee.niNumber || "-"}`, 80, employeeY);
  doc.text(`Works No: ${data.employee.payrollId || "-"}`, 140, employeeY);
  doc.text(`DOB: ${formatDate(data.employee.dateOfBirth)}`, 190, employeeY);
  doc.text(`Start: ${formatDate(data.employee.hireDate)}`, 240, employeeY);

  // Create 12 periods array
  const fullYearPeriods = Array.from({ length: 12 }, (_, i) => {
    const periodNum = i + 1;
    const existingPeriod = data.periods.find((p) => p.taxPeriod === periodNum);
    return existingPeriod || {
      taxPeriod: periodNum,
      nicLetter: "",
      earningsAtLEL: 0,
      earningsLELtoPT: 0,
      earningsPTtoUEL: 0,
      earningsAboveUEL: 0,
      employeeNIC: 0,
      employerNIC: 0,
      taxCode: "",
      grossPay: 0,
      taxablePay: 0,
      incomeTax: 0,
      employeePension: 0,
      studentLoan: 0,
      nhsPensionEmployee: 0,
    };
  });

  // Calculate totals
  const totals = {
    earningsAtLEL: 0,
    earningsLELtoPT: 0,
    earningsPTtoUEL: 0,
    earningsAboveUEL: 0,
    employeeNIC: 0,
    employerNIC: 0,
    grossPay: 0,
    incomeTax: 0,
    employeePension: 0,
    studentLoan: 0,
  };

  const tableData = fullYearPeriods.map((period) => {
    totals.earningsAtLEL += period.earningsAtLEL;
    totals.earningsLELtoPT += period.earningsLELtoPT;
    totals.earningsPTtoUEL += period.earningsPTtoUEL;
    totals.earningsAboveUEL += period.earningsAboveUEL;
    totals.employeeNIC += period.employeeNIC;
    totals.employerNIC += period.employerNIC;
    totals.grossPay += period.grossPay;
    totals.incomeTax += period.incomeTax;
    totals.employeePension += period.employeePension;
    totals.studentLoan += period.studentLoan;

    return [
      period.taxPeriod.toString(),
      period.nicLetter || "-",
      formatValue(period.earningsAtLEL),
      formatValue(period.earningsLELtoPT),
      formatValue(period.earningsPTtoUEL),
      formatValue(period.earningsAboveUEL),
      formatValue(period.employeeNIC),
      formatValue(period.employerNIC),
      period.taxCode || "-",
      formatValue(period.grossPay),
      formatValue(period.incomeTax),
      formatValue(period.employeePension),
      formatValue(period.studentLoan),
    ];
  });

  // Add totals row
  tableData.push([
    "Total",
    "",
    formatValue(totals.earningsAtLEL),
    formatValue(totals.earningsLELtoPT),
    formatValue(totals.earningsPTtoUEL),
    formatValue(totals.earningsAboveUEL),
    formatValue(totals.employeeNIC),
    formatValue(totals.employerNIC),
    "",
    formatValue(totals.grossPay),
    formatValue(totals.incomeTax),
    formatValue(totals.employeePension),
    formatValue(totals.studentLoan),
  ]);

  // Main table
  autoTable(doc, {
    startY: 35,
    head: [[
      "Period",
      "NI",
      "At LEL",
      "LEL-PT",
      "PT-UEL",
      ">UEL",
      "EE NIC",
      "ER NIC",
      "Tax Code",
      "Gross",
      "Tax",
      "Pension",
      "SL",
    ]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 20, halign: "right" },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 20, halign: "right" },
      8: { cellWidth: 18, halign: "center" },
      9: { cellWidth: 22, halign: "right" },
      10: { cellWidth: 20, halign: "right" },
      11: { cellWidth: 20, halign: "right" },
      12: { cellWidth: 18, halign: "right" },
    },
    didParseCell: (cellData) => {
      // Style totals row
      if (cellData.row.index === tableData.length - 1) {
        cellData.cell.styles.fillColor = [240, 240, 240];
        cellData.cell.styles.fontStyle = "bold";
      }
    },
  });

  // YTD Summary section
  const summaryY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Year to Date Summary", 14, summaryY);

  const ytdData = [
    ["Gross Pay YTD", formatValue(data.ytdTotals.grossPayYTD)],
    ["Taxable Pay YTD", formatValue(data.ytdTotals.taxablePayYTD)],
    ["Income Tax YTD", formatValue(data.ytdTotals.incomeTaxYTD)],
    ["Employee NIC YTD", formatValue(data.ytdTotals.employeeNICYTD)],
    ["Employer NIC YTD", formatValue(data.ytdTotals.employerNICYTD)],
    ["Net Pay YTD", formatValue(data.ytdTotals.netPayYTD)],
  ];

  autoTable(doc, {
    startY: summaryY + 3,
    body: ytdData,
    theme: "plain",
    tableWidth: 80,
    margin: { left: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
  });

  // Pension summary
  const pensionData = [
    ["Employee Pension YTD", formatValue(data.ytdTotals.employeePensionYTD)],
    ["Employer Pension YTD", formatValue(data.ytdTotals.employerPensionYTD)],
    ["Student Loan YTD", formatValue(data.ytdTotals.studentLoanYTD)],
  ];

  if (data.ytdTotals.nhsPensionEmployeeYTD > 0 || data.ytdTotals.nhsPensionEmployerYTD > 0) {
    pensionData.push(["NHS Pension (EE) YTD", formatValue(data.ytdTotals.nhsPensionEmployeeYTD)]);
    pensionData.push(["NHS Pension (ER) YTD", formatValue(data.ytdTotals.nhsPensionEmployerYTD)]);
  }

  autoTable(doc, {
    startY: summaryY + 3,
    body: pensionData,
    theme: "plain",
    tableWidth: 80,
    margin: { left: 110 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, halign: "right", fontStyle: "bold" },
    },
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, footerY);
  doc.text(`${data.employee.firstName} ${data.employee.lastName} - Tax Year ${data.taxYear}`, pageWidth - 14, footerY, { align: "right" });

  // Save
  const filename = `P11_${data.employee.lastName}_${data.employee.firstName}_${data.taxYear.replace("/", "-")}.pdf`;
  doc.save(filename);
}

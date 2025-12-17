// Reports components - centralized exports

// Client Reports Navigation
export { ClientReportsNavigation } from "./ClientReportsNavigation";

// Hours Rates Reports
export { HoursRatesReport } from "./hours-rates/HoursRatesReport";
export { HoursRatesReportFilters } from "./hours-rates/HoursRatesReportFilters";
export { HoursRatesReportTable } from "./hours-rates/HoursRatesReportTable";

// Sickness Reports
export { SicknessReport } from "./sickness/SicknessReport";
export { SicknessReportFilters } from "./sickness/SicknessReportFilters";
export { SicknessReportTable } from "./sickness/SicknessReportTable";

// P11 Deductions Working Sheet
export { P11Report } from "./p11/P11Report";
export { P11ReportHeader } from "./p11/P11ReportHeader";
export { P11ReportTable } from "./p11/P11ReportTable";
export { P11ReportTotals } from "./p11/P11ReportTotals";
export { generateP11Pdf } from "./p11/p11PdfGenerator";

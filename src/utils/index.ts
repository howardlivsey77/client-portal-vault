// Utils index - centralized exports with backwards compatibility
// All utils are organized by domain but re-exported here for convenience

// Common utilities
export * from "./common";

// Sickness utilities
export * from "./sickness";

// Payroll utilities  
export * from "./payroll";

// Timesheet utilities
export * from "./timesheet";

// Export utilities
export * from "./export";

// Backwards compatibility - re-export from old paths
// These can be removed after migrating all imports to use @/utils
export * from "./common/dateParser";
export * from "./common/formatters";
export * from "./sickness/sicknessCalculations";
export * from "./sickness/sicknessPaymentCalculator";
export * from "./sickness/sicknessDataMigration";
export * from "./sickness/fixSicknessData";
export * from "./payroll/payslipGenerator";
export * from "./timesheet/timesheetUtils";
export * from "./export/csvExport";
export * from "./export/pdfExport";

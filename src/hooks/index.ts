// Main hooks index - centralized exports with backwards compatibility
// All hooks are organized by domain but re-exported here for convenience

// Common hooks
export { useToast, toast, reducer } from "./common/use-toast";
export { useIsMobile } from "./common/use-mobile";
export { useDraggable } from "./common/useDraggable";
export { useDroppable } from "./common/useDroppable";

// Auth hooks
export { useAuthInitialization } from "./auth/useAuthInitialization";

// Dashboard hooks
export { useDashboardData } from "./dashboard/useDashboardData";
export { useHmrcDashboardData } from "./dashboard/useHmrcDashboardData";
export type { HmrcPeriodData } from "./dashboard/useHmrcDashboardData";
export { usePayrollSummaryData } from "./dashboard/usePayrollSummaryData";
export type { PeriodPayrollData, PayrollSummaryData } from "./dashboard/usePayrollSummaryData";

// Employees hooks
export { useEmployees } from "./employees/useEmployees";
export type { Employee } from "./employees/useEmployees";
export { useEmployeeDetails } from "./employees/useEmployeeDetails";
export { useEmployeeForm } from "./employees/useEmployeeForm";
export { useDepartments } from "./employees/useDepartments";
export { useEmployeeImport } from "./employees/useEmployeeImport";
export { useEmployeeInvite } from "./employees/useEmployeeInvite";
export { useEmployeeTimesheet } from "./employees/useEmployeeTimesheet";
export type { WeeklyTimesheetDay } from "./employees/useEmployeeTimesheet";
export { useSicknessData } from "./employees/useSicknessData";
export { useSicknessScheme } from "./employees/useSicknessScheme";
export { useCostCentres } from "./employees/useCostCentres";

// Permissions hook
export { usePermissions } from "./usePermissions";
export type { Permissions } from "./usePermissions";

// Confirmation dialog hook
export { useConfirmation } from "./useConfirmation";

// Reports hooks
export { useHoursRatesReport } from "./reports/useHoursRatesReport";
export type { HoursRatesReportData, HoursRatesReportFilters } from "./reports/useHoursRatesReport";
export { useSicknessReport } from "./reports/useSicknessReport";
export type { SicknessReportData, SicknessReportFilters } from "./reports/useSicknessReport";

// Users hooks
export { useUsers } from "./users/useUsers";
export type { UserProfile } from "./users/useUsers";
export { useTeamMembers } from "./users/useTeamMembers";
export type { TeamMember } from "./users/useTeamMembers";
export { useInvites } from "./users/useInvites";
export type { InvitationMetadata } from "./users/useInvites";
export { useInvitationHistory } from "./users/useInvitationHistory";
export type { InvitationResendLog } from "./users/useInvitationHistory";

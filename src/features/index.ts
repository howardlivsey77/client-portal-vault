// Features - centralized exports

// Company Management
export { default as CompanyManagement } from "./company-management/CompanyManagement";
export { CompanyForm } from "./company-management/components/CompanyForm";
export { CompanyHeader } from "./company-management/components/CompanyHeader";
export { CompanyList } from "./company-management/components/CompanyList";
export { DeleteCompanyDialog } from "./company-management/components/DeleteCompanyDialog";
export { useCompanyManagement } from "./company-management/hooks/useCompanyManagement";

// Company Settings
export { default as CompanySettings } from "./company-settings/CompanySettings";
export { AddressSection } from "./company-settings/components/AddressSection";
export { CompanyInfoSection } from "./company-settings/components/CompanyInfoSection";
export { ContactInfoSection } from "./company-settings/components/ContactInfoSection";
export { HmrcInfoSection } from "./company-settings/components/HmrcInfoSection";
export { LogoUploadSection } from "./company-settings/components/LogoUploadSection";
export { SicknessSchemeForm } from "./company-settings/components/SicknessSchemeForm";
export { useCompanyForm } from "./company-settings/hooks/useCompanyForm";
export { useSicknessSchemes } from "./company-settings/hooks/useSicknessSchemes";
export { default as DepartmentsSettingsTab } from "./company-settings/tabs/DepartmentsSettingsTab";
export { default as GeneralSettingsTab } from "./company-settings/tabs/GeneralSettingsTab";
export { default as HolidaysSettingsTab } from "./company-settings/tabs/HolidaysSettingsTab";
export { default as LocationsSettingsTab } from "./company-settings/tabs/LocationsSettingsTab";
export { default as SicknessSettingsTab } from "./company-settings/tabs/SicknessSettingsTab";
export type { CompanyFormValues } from "./company-settings/types";

// Sickness components
export { EligibilityRuleRow } from "./company-settings/components/sickness/EligibilityRuleRow";
export { EligibilityRulesSection } from "./company-settings/components/sickness/EligibilityRulesSection";
export { EligibilityRulesTable } from "./company-settings/components/sickness/EligibilityRulesTable";
export { EmptySchemesState } from "./company-settings/components/sickness/EmptySchemesState";
export { SchemesList } from "./company-settings/components/sickness/SchemesList";
export { SchemesLoading } from "./company-settings/components/sickness/SchemesLoading";
export { SicknessSchemeBasicInfo } from "./company-settings/components/sickness/SicknessSchemeBasicInfo";
export { sicknessSchemeFormSchema } from "./company-settings/components/sickness/SicknessSchemeFormSchema";
export * from "./company-settings/components/sickness/unitUtils";

// Timesheet Settings
export { TimesheetSettingsForm } from "./timesheet-settings/TimesheetSettingsForm";
export { ApprovalSettingsSection } from "./timesheet-settings/ApprovalSettingsSection";
export { ClockInTolerancesSection } from "./timesheet-settings/ClockInTolerancesSection";
export { ClockOutTolerancesSection } from "./timesheet-settings/ClockOutTolerancesSection";
export { TimeRoundingSection } from "./timesheet-settings/TimeRoundingSection";
export { timesheetSettingsSchema } from "./timesheet-settings/schema";

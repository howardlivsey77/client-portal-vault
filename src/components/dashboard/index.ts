// Dashboard components - centralized exports
// Main dashboard components
export { EmployeeDashboard } from "./EmployeeDashboard";
export { DashboardHeader } from "./DashboardHeader";
export { CompanyOverviewCard } from "./CompanyOverviewCard";
export { DepartmentDistributionCard } from "./DepartmentDistributionCard";
export { HmrcDashboardCard } from "./HmrcDashboardCard";
export { PayrollSummaryCard } from "./PayrollSummaryCard";
export { RecentHires } from "./RecentHires";
export { TaskOverview } from "./TaskOverview";

// Document components
export { DocumentCard } from "./DocumentCard";
export { DocumentGrid } from "./DocumentGrid";
export { DocumentUploadModal } from "./DocumentUploadModal";
export { AddDocumentButton } from "./AddDocumentButton";

// Folder components
export { FolderExplorer } from "./FolderExplorer";
export { FolderUploadModal } from "./FolderUploadModal";
export { DeleteFolderDialog } from "./DeleteFolderDialog";

// Folder sub-components
export { AddFolderDialog } from "./folder/AddFolderDialog";
export { DeleteFolderDialog as FolderDeleteDialog } from "./folder/DeleteFolderDialog";
export { EditFolderDialog } from "./folder/EditFolderDialog";
export { FolderTile } from "./folder/FolderItem";
export { useFolderExplorer } from "./folder/useFolderExplorer";

// Documents sub-components
export { DocumentList } from "./documents/DocumentList";
export { useDocuments } from "./documents/useDocuments";
export { useSubfolders } from "./documents/useSubfolders";

// Tasks sub-components
export { TaskDialog } from "./tasks/TaskDialog";
export { TaskItem } from "./tasks/TaskItem";

// Reports sub-components
export { EmployeeDetailsReport } from "./reports/employee-details/EmployeeDetailsReport";
export { EmployeeChangesReport } from "./reports/employee-changes/EmployeeChangesReport";

// Tabs
export { DocumentsTab } from "./tabs/DocumentsTab";

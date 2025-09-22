
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { FolderUploadModal } from "@/components/dashboard/FolderUploadModal";
import { useAuth } from "@/providers/AuthProvider";
import { useLocation } from "react-router-dom";
import { TaskList } from "@/components/dashboard/tasks/TaskList";
import { ReportsNavigation } from "@/components/dashboard/reports/ReportsNavigation";
import { PayrollInputWizard } from "@/components/payroll/PayrollInputWizard";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { DocumentsTab } from "@/components/dashboard/tabs/DocumentsTab";
import { PayrollTab } from "@/components/dashboard/tabs/PayrollTab";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TimesheetsTab } from "@/components/dashboard/tabs/TimesheetsTab";
import { CompaniesTable } from "@/components/companies/CompaniesTable";

const Index = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [payrollWizardOpen, setPayrollWizardOpen] = useState(false);
  const [isFullscreenFolderView, setIsFullscreenFolderView] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  // Parse the tab from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["overview", "companies", "documents", "tasks", "reports", "payroll", "timesheets"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  
  // Handle folder selection
  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    
    // Switch to fullscreen view if a folder is selected, otherwise back to split view
    setIsFullscreenFolderView(!!folderId);
    
    // If not already on documents tab, switch to it
    if (activeTab !== "documents") {
      setActiveTab("documents");
    }
  };
  
  // Render the appropriate content based on the active tab
  const renderContent = () => {
    switch(activeTab) {
      case "overview":
        return <EmployeeDashboard />;
      case "companies":
        return <CompaniesTable />;
      case "documents":
        return (
          <DocumentsTab
            onAddDocument={() => setUploadModalOpen(true)}
            selectedFolderId={selectedFolderId}
            onFolderSelect={handleFolderSelect}
            isFullscreenFolderView={isFullscreenFolderView}
            onSetFullscreenView={setIsFullscreenFolderView}
          />
        );
      case "tasks":
        return <TaskList />;
      case "reports":
        return <ReportsNavigation />;
      case "payroll":
        return <PayrollTab onOpenPayrollWizard={() => setPayrollWizardOpen(true)} />;
      case "timesheets":
        return <TimesheetsTab />;
      default:
        return <EmployeeDashboard />;
    }
  };
  
  // Should we show the dashboard header?
  const showHeader = activeTab !== "tasks";
  
  return (
    <PageContainer>
      {showHeader && (
        <DashboardHeader 
          onOpenUploadModal={() => setUploadModalOpen(true)} 
          activeTab={activeTab}
        />
      )}
      
      <div className="animate-fade-in">
        {renderContent()}
      </div>
      
      <FolderUploadModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen}
        selectedFolderId={selectedFolderId}
      />

      <PayrollInputWizard
        open={payrollWizardOpen}
        onOpenChange={setPayrollWizardOpen}
      />
    </PageContainer>
  );
};

export default Index;

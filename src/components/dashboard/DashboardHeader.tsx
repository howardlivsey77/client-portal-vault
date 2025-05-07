
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
interface DashboardHeaderProps {
  onOpenUploadModal: () => void;
  activeTab: string;
}
export function DashboardHeader({
  onOpenUploadModal,
  activeTab
}: DashboardHeaderProps) {
  const {
    user
  } = useAuth();

  // Set header title based on active tab
  const getHeaderTitle = () => {
    switch (activeTab) {
      case "payroll":
        return "Payroll Input";
      default:
        return "Dashboard";
    }
  };
  
  // Only show upload button on documents tab
  const shouldShowUploadButton = activeTab === "documents";
  
  return <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{getHeaderTitle()}</h1>
        
        {shouldShowUploadButton && <div className="flex items-center gap-2">
            <Button onClick={onOpenUploadModal}>
              <FileText className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>}
      </div>
      
      <div className="mb-6">
        
      </div>
    </>;
}

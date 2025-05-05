
import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { DocumentGrid } from "@/components/dashboard/DocumentGrid";
import { DocumentUploadModal } from "@/components/dashboard/DocumentUploadModal";
import { FolderExplorer } from "@/components/dashboard/FolderExplorer";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FileText, Share, Users } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useLocation } from "react-router-dom";

const Index = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { user } = useAuth();
  const location = useLocation();
  
  // Parse the tab from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["overview", "documents", "shared"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setUploadModalOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="text-sm text-muted-foreground">
          Welcome {user?.email}! Here's an overview of your company's data.
        </div>
      </div>
      
      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="shared">Shared with Me</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 animate-fade-in">
          <EmployeeDashboard />
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64">
              <FolderExplorer 
                onFolderSelect={setSelectedFolderId}
                selectedFolderId={selectedFolderId}
              />
            </div>
            <div className="flex-1">
              <DocumentGrid 
                onAddDocument={() => setUploadModalOpen(true)} 
                selectedFolderId={selectedFolderId}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="shared" className="mt-6 animate-fade-in">
          <div className="flex flex-col items-center justify-center py-12">
            <Share className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-xl font-medium">No shared documents</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Documents shared with you will appear here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <DocumentUploadModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen}
        selectedFolderId={selectedFolderId}
      />
    </PageContainer>
  );
};

export default Index;

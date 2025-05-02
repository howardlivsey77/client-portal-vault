
import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { DocumentGrid } from "@/components/dashboard/DocumentGrid";
import { DocumentUploadModal } from "@/components/dashboard/DocumentUploadModal";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FileText, Share, User, Users } from "lucide-react";

const Index = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Document Vault</h1>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setUploadModalOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="text-sm text-muted-foreground">
          A secure place to store and share documents with your clients and team members.
        </div>
      </div>
      
      <Tabs defaultValue="all" className="mb-8">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="shared">Shared with Me</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Manage Access
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-6 animate-fade-in">
          <DocumentGrid onAddDocument={() => setUploadModalOpen(true)} />
        </TabsContent>
        
        <TabsContent value="shared" className="mt-6 animate-fade-in">
          <div className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-xl font-medium">No shared documents</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Documents shared with you will appear here.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6 animate-fade-in">
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-xl font-medium">No recent documents</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Your recently accessed documents will appear here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      <DocumentUploadModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen} 
      />
    </PageContainer>
  );
};

export default Index;

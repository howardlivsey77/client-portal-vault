
import React from "react";
import { Card } from "@/components/ui/card";
import { Folder } from "lucide-react";
import { useDocuments } from "./documents/useDocuments";
import { useSubfolders } from "./documents/useSubfolders";
import { DocumentGridHeader } from "./documents/DocumentGridHeader";
import { SubfolderList } from "./documents/SubfolderList";
import { DocumentList } from "./documents/DocumentList";
import { EmptyFolder } from "./documents/EmptyFolder";
import { DocumentGridProps } from "./documents/types";

export interface Document {
  id: string;
  title: string;
  type: string;
  updatedAt: string;
  size: string;
  folderId: string | null;
}

export function DocumentGrid({
  onAddDocument,
  selectedFolderId,
  onNavigateBack,
  folderPath = [],
  onFolderSelect
}: DocumentGridProps) {
  // Get documents and subfolders using custom hooks
  const { documents } = useDocuments(selectedFolderId);
  const subfolders = useSubfolders(selectedFolderId);
  
  // Handle folder selection
  const handleFolderSelect = (folderId: string) => {
    if (onFolderSelect) {
      onFolderSelect(folderId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb and back button */}
      <DocumentGridHeader 
        selectedFolderId={selectedFolderId}
        onNavigateBack={onNavigateBack}
        folderPath={folderPath}
        onAddDocument={onAddDocument}
      />
      
      {/* Subfolders section */}
      {selectedFolderId && (
        <SubfolderList 
          subfolders={subfolders} 
          onFolderSelect={handleFolderSelect} 
        />
      )}
      
      {/* Document list */}
      {selectedFolderId && (
        <>
          <h3 className="text-lg font-medium mb-3">Documents</h3>
          {documents.length > 0 ? (
            <DocumentList documents={documents} />
          ) : (
            <EmptyFolder onAddDocument={onAddDocument} />
          )}
        </>
      )}
      
      {!selectedFolderId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* This area would show root level documents */}
          <p className="col-span-full text-muted-foreground">
            Select a folder to view its contents
          </p>
        </div>
      )}
    </div>
  );
}

// Extend Window interface to include our functions
declare global {
  interface Window {
    addDocument: (doc: Document) => void;
    moveDocument: (docId: string, targetFolderId: string | null) => void;
  }
}


import React from "react";
import { useDocuments } from "./documents/useDocuments";
import { useSubfolders } from "./documents/useSubfolders";
import { DocumentGridHeader } from "./documents/DocumentGridHeader";
import { SubfolderList } from "./documents/SubfolderList";
import { DocumentList } from "./documents/DocumentList";
import { EmptyFolder } from "./documents/EmptyFolder";
import { DocumentGridProps } from "./documents/types";

// Convert database document to legacy format for compatibility
const convertToLegacyDocument = (dbDoc: any) => ({
  id: dbDoc.id,
  title: dbDoc.title,
  type: dbDoc.file_name.split('.').pop()?.toUpperCase() || "FILE",
  updatedAt: new Date(dbDoc.updated_at).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }),
  size: `${(dbDoc.file_size / (1024 * 1024)).toFixed(1)} MB`,
  folderId: dbDoc.folder_id
});

export function DocumentGrid({
  onAddDocument,
  selectedFolderId,
  onNavigateBack,
  folderPath = [],
  onFolderSelect,
  onAddFolder
}: DocumentGridProps) {
  const { documents: dbDocuments, loading } = useDocuments(selectedFolderId);
  const subfolders = useSubfolders(selectedFolderId);

  // Convert database documents to legacy format
  const documents = dbDocuments.map(convertToLegacyDocument);

  // Handle folder selection
  const handleFolderSelect = (folderId: string) => {
    if (onFolderSelect) {
      onFolderSelect(folderId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb and action buttons */}
      <DocumentGridHeader 
        selectedFolderId={selectedFolderId} 
        onNavigateBack={onNavigateBack} 
        folderPath={folderPath} 
        onAddDocument={onAddDocument}
        onAddFolder={onAddFolder}
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
            <EmptyFolder />
          )}
        </>
      )}
      
      {!selectedFolderId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* This area would show root level documents */}
        </div>
      )}
    </div>
  );
}

export interface Document {
  id: string;
  title: string;
  type: string;
  updatedAt: string;
  size: string;
  folderId: string | null;
}

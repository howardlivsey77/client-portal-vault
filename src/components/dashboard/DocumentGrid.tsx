import React from "react";
import { useDocuments } from "./documents/useDocuments";
import { useSubfolders } from "./documents/useSubfolders";
import { DocumentGridHeader } from "./documents/DocumentGridHeader";
import { SubfolderList } from "./documents/SubfolderList";
import { DocumentList } from "./documents/DocumentList";
import { EmptyFolder } from "./documents/EmptyFolder";
import { DocumentGridProps } from "./documents/types";
import { DragDropProvider } from "@/contexts/DragDropContext";
import { documentFolderService } from "@/services/documentFolderService";
import { toast } from "sonner";
import { useDroppable } from "@/hooks/useDroppable";
import { cn } from "@/lib/utils";

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
  const { documents: dbDocuments, loading, moveDocument } = useDocuments(selectedFolderId);
  const subfolders = useSubfolders(selectedFolderId);

  // Handle moving documents between folders
  const handleMoveDocument = async (docId: string, targetFolderId: string | null) => {
    try {
      await moveDocument(docId, targetFolderId);
      toast.success("Document moved successfully");
    } catch (error) {
      console.error('Failed to move document:', error);
      toast.error("Failed to move document");
      throw error;
    }
  };

  // Handle moving folders
  const handleMoveFolder = async (folderId: string, targetParentId: string | null) => {
    try {
      await documentFolderService.moveFolder(folderId, targetParentId);
      toast.success("Folder moved successfully");
      // Refresh the current view
      window.location.reload();
    } catch (error) {
      console.error('Failed to move folder:', error);
      toast.error("Failed to move folder");
      throw error;
    }
  };

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

  // Root drop zone for documents grid
  const RootDropZone = ({ children }: { children: React.ReactNode }) => {
    const { isOver, canDropHere, dropProps } = useDroppable({
      target: {
        type: 'folder',
        id: null, // root folder
        name: 'All Documents',
      },
    });

    return (
      <div 
        {...dropProps}
        className={cn(
          "min-h-[200px] transition-all",
          isOver && "bg-primary/5 border-2 border-dashed border-primary/50 rounded-lg",
          canDropHere && "border border-dashed border-primary/30 rounded-lg"
        )}
      >
        {children}
      </div>
    );
  };

  return (
    <DragDropProvider 
      onMoveDocument={handleMoveDocument}
      onMoveFolder={handleMoveFolder}
    >
      <RootDropZone>
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
      </RootDropZone>
    </DragDropProvider>
  );
}

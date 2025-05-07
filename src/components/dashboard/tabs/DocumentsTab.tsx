import { useState } from "react";
import { DocumentGrid } from "@/components/dashboard/DocumentGrid";
import { FolderExplorer } from "@/components/dashboard/FolderExplorer";
import { getFolderPathById, loadFolderStructure } from "@/components/dashboard/folder/folderService";

interface DocumentsTabProps {
  onAddDocument: () => void;
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  isFullscreenFolderView: boolean;
  onSetFullscreenView: (isFullscreen: boolean) => void;
}

export function DocumentsTab({
  onAddDocument,
  selectedFolderId,
  onFolderSelect,
  isFullscreenFolderView,
  onSetFullscreenView
}: DocumentsTabProps) {
  // Handle navigation back from fullscreen view
  const handleNavigateBack = () => {
    const folderStructure = loadFolderStructure();
    
    // If inside a subfolder, navigate to parent folder
    if (selectedFolderId) {
      const parentId = getParentFolderId(folderStructure, selectedFolderId);
      if (parentId) {
        onFolderSelect(parentId);
        return;
      }
    }
    
    // Otherwise, go back to the folder explorer view
    onSetFullscreenView(false);
    onFolderSelect(null);
  };
  
  // Helper function to get parent folder ID
  const getParentFolderId = (folders: any[], folderId: string | null): string | null => {
    if (!folderId) return null;
    
    for (const folder of folders) {
      // Check if any of this folder's children is the one we're looking for
      for (const child of folder.children) {
        if (child.id === folderId) {
          return folder.id;
        }
      }
      
      // Check in deeper levels
      const foundInChildren = getParentFolderId(folder.children, folderId);
      if (foundInChildren) return foundInChildren;
    }
    
    return null;
  };
  
  // Get the folder path for the current folder
  const getFolderPath = () => {
    const folderStructure = loadFolderStructure();
    return getFolderPathById(folderStructure, selectedFolderId);
  };

  return isFullscreenFolderView ? (
    <div className="w-full">
      <DocumentGrid 
        onAddDocument={onAddDocument} 
        selectedFolderId={selectedFolderId}
        onNavigateBack={handleNavigateBack}
        folderPath={getFolderPath()}
        onFolderSelect={onFolderSelect}
      />
    </div>
  ) : (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2">
        <FolderExplorer 
          onFolderSelect={onFolderSelect}
          selectedFolderId={selectedFolderId}
        />
      </div>
      <div className="lg:col-span-3">
        <DocumentGrid 
          onAddDocument={onAddDocument} 
          selectedFolderId={selectedFolderId}
        />
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { DocumentGrid } from "@/components/dashboard/DocumentGrid";
import { FolderExplorer } from "@/components/dashboard/FolderExplorer";
import { documentFolderService } from "@/services/documentFolderService";
import { useCompany } from "@/providers/CompanyProvider";
import { AddFolderDialog } from "@/components/dashboard/folder/AddFolderDialog";
import { toast } from "@/hooks/use-toast";

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
  const { currentCompany } = useCompany();
  const [folderPath, setFolderPath] = useState<string[]>([]);
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  // Load folder path when selectedFolderId changes
  useEffect(() => {
    loadFolderPath();
  }, [selectedFolderId, currentCompany?.id]);

  const loadFolderPath = async () => {
    if (!currentCompany?.id) {
      setFolderPath([]);
      return;
    }

    try {
      const path = await documentFolderService.getFolderPath(selectedFolderId);
      setFolderPath(path);
    } catch (error) {
      console.error('Error loading folder path:', error);
      setFolderPath(selectedFolderId ? ["Unknown Folder"] : ["All Documents"]);
    }
  };

  // Handle navigation back from fullscreen view
  const handleNavigateBack = async () => {
    if (!currentCompany?.id) return;
    
    // If inside a subfolder, navigate to parent folder
    if (selectedFolderId) {
      try {
        const allFolders = await documentFolderService.getFolders(currentCompany.id);
        const currentFolder = allFolders.find(f => f.id === selectedFolderId);
        if (currentFolder?.parent_id) {
          onFolderSelect(currentFolder.parent_id);
          return;
        }
      } catch (error) {
        console.error('Error finding parent folder:', error);
      }
    }
    
    // Otherwise, go back to the folder explorer view
    onSetFullscreenView(false);
    onFolderSelect(null);
  };

  // Handle adding a new subfolder
  const handleAddFolder = () => {
    setIsAddingFolder(true);
  };

  // Handle creating the folder
  const handleCreateFolder = async (folderName: string, parentId: string | null) => {
    if (!currentCompany?.id) return;
    
    try {
      await documentFolderService.createFolder(currentCompany.id, folderName, parentId || selectedFolderId);
      await loadFolderPath(); // Refresh folder path
      toast({
        title: "Folder created",
        description: `Subfolder "${folderName}" has been created successfully.`
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error creating folder",
        description: "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  return isFullscreenFolderView ? (
    <div className="w-full">
      <DocumentGrid 
        onAddDocument={onAddDocument} 
        selectedFolderId={selectedFolderId}
        onNavigateBack={handleNavigateBack}
        folderPath={folderPath}
        onFolderSelect={onFolderSelect}
        onAddFolder={handleAddFolder}
      />
      
      <AddFolderDialog
        open={isAddingFolder}
        onOpenChange={setIsAddingFolder}
        parentId={selectedFolderId}
        onAddFolder={handleCreateFolder}
        getFolderPath={() => folderPath}
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
          folderPath={folderPath}
          onFolderSelect={onFolderSelect}
          onAddFolder={handleAddFolder}
        />
        
        <AddFolderDialog
          open={isAddingFolder}
          onOpenChange={setIsAddingFolder}
          parentId={selectedFolderId}
          onAddFolder={handleCreateFolder}
          getFolderPath={() => folderPath}
        />
      </div>
    </div>
  );
}

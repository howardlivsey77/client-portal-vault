
import { useState } from "react";
import { AddFolderDialog } from "./folder/AddFolderDialog";
import { EditFolderDialog } from "./folder/EditFolderDialog";
import { DeleteFolderDialog } from "./folder/DeleteFolderDialog";
import { FolderExplorerProps } from "./types/folder.types";
import { FolderGrid } from "./folder/FolderGrid";
import { EmptyFolderState } from "./folder/EmptyFolderState";
import { FolderExplorerHeader } from "./folder/FolderExplorerHeader";
import { FolderExplorerLoading } from "./folder/FolderExplorerLoading";
import { useFolderExplorer } from "./folder/useFolderExplorer";
import { DragDropProvider } from "@/contexts/DragDropContext";
import { documentFolderService } from "@/services/documents";
import { toast } from "sonner";

export { type FolderItem } from "./types/folder.types";

export function FolderExplorer({
  onFolderSelect,
  selectedFolderId
}: FolderExplorerProps) {
  const {
    folderStructure,
    loading,
    currentFolderId,
    getCurrentFolderContents,
    navigateToFolder,
    navigateBack,
    addFolder,
    editFolder,
    handleDeleteFolder,
    getFolderPathSync,
    findFolder
  } = useFolderExplorer(onFolderSelect);

  // States for folder creation
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  // States for folder editing
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  // States for folder deletion
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingFolderName, setDeletingFolderName] = useState("");

  // Open dialog to add a new folder
  const openAddFolderDialog = (parentId: string | null = null) => {
    setCurrentParentId(parentId || currentFolderId);
    setIsAddingFolder(true);
  };

  // Open dialog to edit a folder
  const openEditFolderDialog = (folderId: string) => {
    const folderToEdit = findFolder(folderStructure, folderId);
    if (folderToEdit) {
      setEditingFolderId(folderId);
      setEditingFolderName(folderToEdit.name);
      setIsEditingFolder(true);
    }
  };

  // Open dialog to delete a folder
  const openDeleteFolderDialog = (folderId: string) => {
    const folderToDelete = findFolder(folderStructure, folderId);
    if (folderToDelete) {
      setDeletingFolderId(folderId);
      setDeletingFolderName(folderToDelete.name);
      setIsDeletingFolder(true);
    }
  };

  const currentFolders = getCurrentFolderContents();

  // Handle folder movement via drag and drop
  const handleMoveFolder = async (folderId: string, targetParentId: string | null) => {
    try {
      await documentFolderService.moveFolder(folderId, targetParentId);
      // Refresh the folder structure after successful move
      window.location.reload(); // Simple refresh - could be optimized with state management
      toast.success("Folder moved successfully");
    } catch (error) {
      console.error("Failed to move folder:", error);
      toast.error("Failed to move folder");
    }
  };

  if (loading) {
    return <FolderExplorerLoading />;
  }

  return (
    <DragDropProvider onMoveFolder={handleMoveFolder}>
      <div>
      <FolderExplorerHeader
        currentFolderId={currentFolderId}
        onNavigateBack={navigateBack}
        onAddFolder={() => openAddFolderDialog(currentFolderId)}
      />
      
      {currentFolders.length > 0 ? (
        <FolderGrid
          folders={currentFolders}
          selectedFolderId={selectedFolderId}
          onFolderSelect={navigateToFolder}
          onEditFolder={openEditFolderDialog}
          onAddSubfolder={openAddFolderDialog}
          onDeleteFolder={openDeleteFolderDialog}
        />
      ) : (
        <EmptyFolderState
          currentFolderId={currentFolderId}
          onAddFolder={() => openAddFolderDialog(currentFolderId)}
        />
      )}
      
      <AddFolderDialog
        open={isAddingFolder}
        onOpenChange={setIsAddingFolder}
        parentId={currentParentId}
        onAddFolder={addFolder}
        getFolderPath={getFolderPathSync}
      />
      
      <EditFolderDialog
        open={isEditingFolder}
        onOpenChange={setIsEditingFolder}
        folderId={editingFolderId}
        folderName={editingFolderName}
        onEditFolder={editFolder}
      />
      
      <DeleteFolderDialog
        open={isDeletingFolder}
        onOpenChange={setIsDeletingFolder}
        folderId={deletingFolderId}
        folderName={deletingFolderName}
        onDeleteFolder={handleDeleteFolder}
      />
      </div>
    </DragDropProvider>
  );
}

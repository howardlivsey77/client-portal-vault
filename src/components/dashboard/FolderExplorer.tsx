import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FolderPlus, ArrowLeft } from "lucide-react";
import { AddFolderDialog } from "./folder/AddFolderDialog";
import { EditFolderDialog } from "./folder/EditFolderDialog";
import { DeleteFolderDialog } from "./folder/DeleteFolderDialog";
import { loadFolderStructure, saveFolderStructure, getFolderPathById, addSubFolder, updateFolderName, findFolderById, deleteFolder, updateDocumentsAfterFolderDeletion } from "./folder/folderService";
import { FolderItem as FolderItemType, FolderExplorerProps } from "./types/folder.types";
import { FolderTile } from "./folder/FolderItem";
import { Card } from "@/components/ui/card";
export { type FolderItem } from "./types/folder.types";
export function FolderExplorer({
  onFolderSelect,
  selectedFolderId
}: FolderExplorerProps) {
  const [folderStructure, setFolderStructure] = useState<FolderItemType[]>(loadFolderStructure);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>([]);

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

  // Save folder structure to localStorage whenever it changes
  useEffect(() => {
    saveFolderStructure(folderStructure);
  }, [folderStructure]);

  // Get current folder's contents
  const getCurrentFolderContents = (): FolderItemType[] => {
    if (!currentFolderId) {
      return folderStructure;
    }
    const findChildrenById = (folders: FolderItemType[], id: string): FolderItemType[] => {
      for (const folder of folders) {
        if (folder.id === id) {
          return folder.children;
        }
        if (folder.children.length > 0) {
          const nestedResult = findChildrenById(folder.children, id);
          if (nestedResult.length > 0) {
            return nestedResult;
          }
        }
      }
      return [];
    };
    return findChildrenById(folderStructure, currentFolderId);
  };

  // Get current folder path for breadcrumb
  const getCurrentFolderPath = (): string[] => {
    return getFolderPathById(folderStructure, currentFolderId);
  };

  // Navigate to a specific folder
  const navigateToFolder = (folderId: string | null) => {
    if (folderId) {
      setNavigationStack(prev => [...prev, folderId]);
      setCurrentFolderId(folderId);
      onFolderSelect(folderId);
    } else {
      // Root level
      setNavigationStack([]);
      setCurrentFolderId(null);
      onFolderSelect(null);
    }
  };

  // Navigate back to parent folder
  const navigateBack = () => {
    if (navigationStack.length <= 1) {
      // Go back to root
      setNavigationStack([]);
      setCurrentFolderId(null);
      onFolderSelect(null);
      return;
    }

    // Remove current folder from stack and set previous as current
    const newStack = navigationStack.slice(0, -1);
    const parentFolderId = newStack.length > 0 ? newStack[newStack.length - 1] : null;
    setNavigationStack(newStack);
    setCurrentFolderId(parentFolderId);
    onFolderSelect(parentFolderId);
  };

  // Add a new folder
  const addFolder = (newFolderName: string, parentId: string | null) => {
    const newFolder: FolderItemType = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      parentId: parentId,
      children: []
    };

    // If it's a root level folder
    if (!parentId) {
      setFolderStructure([...folderStructure, newFolder]);
    } else {
      // If it's a subfolder
      const updatedStructure = addSubFolder(folderStructure, parentId, newFolder);
      setFolderStructure(updatedStructure);

      // Ensure the parent folder is expanded
      setExpandedFolders(prev => ({
        ...prev,
        [parentId]: true
      }));
    }
  };

  // Edit folder name
  const editFolder = (folderId: string, newName: string) => {
    const updatedStructure = updateFolderName(folderStructure, folderId, newName);
    setFolderStructure(updatedStructure);
  };

  // Delete folder
  const handleDeleteFolder = (folderId: string) => {
    const updatedStructure = deleteFolder(folderStructure, folderId);
    setFolderStructure(updatedStructure);

    // Update documents to remove references to deleted folder
    updateDocumentsAfterFolderDeletion(folderId);

    // If deleting current folder, go back
    if (currentFolderId === folderId) {
      navigateBack();
    }
  };

  // Open dialog to add a new folder
  const openAddFolderDialog = (parentId: string | null = null) => {
    setCurrentParentId(parentId || currentFolderId);
    setIsAddingFolder(true);
  };

  // Open dialog to edit a folder
  const openEditFolderDialog = (folderId: string) => {
    const folderToEdit = findFolderById(folderStructure, folderId);
    if (folderToEdit) {
      setEditingFolderId(folderId);
      setEditingFolderName(folderToEdit.name);
      setIsEditingFolder(true);
    }
  };

  // Open dialog to delete a folder
  const openDeleteFolderDialog = (folderId: string) => {
    const folderToDelete = findFolderById(folderStructure, folderId);
    if (folderToDelete) {
      setDeletingFolderId(folderId);
      setDeletingFolderName(folderToDelete.name);
      setIsDeletingFolder(true);
    }
  };

  // Get folder path for display
  const getFolderPath = (folderId: string | null): string[] => {
    return getFolderPathById(folderStructure, folderId);
  };
  const currentFolders = getCurrentFolderContents();
  const folderPath = getCurrentFolderPath();
  return <div>
      <div className="flex justify-between items-center mb-6">
        
        <div className="flex gap-2">
          {currentFolderId && <Button variant="outline" onClick={navigateBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>}
          <Button onClick={() => openAddFolderDialog(currentFolderId)} className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4" />
            {currentFolderId ? "New Subfolder" : "New Folder"}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentFolders.map(folder => <FolderTile key={folder.id} folder={folder} isSelected={selectedFolderId === folder.id} onFolderSelect={() => navigateToFolder(folder.id)} onEditFolder={openEditFolderDialog} onAddSubfolder={openAddFolderDialog} onDeleteFolder={openDeleteFolderDialog} />)}
      </div>
      
      {currentFolders.length === 0 && <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <h3 className="text-xl font-medium">
              {currentFolderId ? "This folder is empty" : "No folders yet"}
            </h3>
            <p className="text-muted-foreground">
              {currentFolderId ? "Create a subfolder to organize your documents" : "Create a folder to organize your documents"}
            </p>
            <Button onClick={() => openAddFolderDialog(currentFolderId)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              {currentFolderId ? "New Subfolder" : "New Folder"}
            </Button>
          </div>
        </Card>}
      
      <AddFolderDialog open={isAddingFolder} onOpenChange={setIsAddingFolder} parentId={currentParentId} onAddFolder={addFolder} getFolderPath={getFolderPath} />
      
      <EditFolderDialog open={isEditingFolder} onOpenChange={setIsEditingFolder} folderId={editingFolderId} folderName={editingFolderName} onEditFolder={editFolder} />
      
      <DeleteFolderDialog open={isDeletingFolder} onOpenChange={setIsDeletingFolder} folderId={deletingFolderId} folderName={deletingFolderName} onDeleteFolder={handleDeleteFolder} />
    </div>;
}
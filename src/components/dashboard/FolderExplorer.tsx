
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FolderPlus, ArrowLeft } from "lucide-react";
import { AddFolderDialog } from "./folder/AddFolderDialog";
import { EditFolderDialog } from "./folder/EditFolderDialog";
import { DeleteFolderDialog } from "./folder/DeleteFolderDialog";
import { documentFolderService } from "@/services/documentFolderService";
import { FolderItem as FolderItemType, FolderExplorerProps } from "./types/folder.types";
import { FolderTile } from "./folder/FolderItem";
import { Card } from "@/components/ui/card";
import { useCompany } from "@/providers/CompanyProvider";
import { toast } from "@/hooks/use-toast";

export { type FolderItem } from "./types/folder.types";

export function FolderExplorer({
  onFolderSelect,
  selectedFolderId
}: FolderExplorerProps) {
  const { currentCompany } = useCompany();
  const [folderStructure, setFolderStructure] = useState<FolderItemType[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Load folders when company changes
  useEffect(() => {
    loadFolders();
  }, [currentCompany?.id]);

  const loadFolders = async () => {
    if (!currentCompany?.id) return;
    
    setLoading(true);
    try {
      const dbFolders = await documentFolderService.getFolders(currentCompany.id);
      const folderTree = buildFolderTree(dbFolders);
      setFolderStructure(folderTree);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast({
        title: "Error loading folders",
        description: "Failed to load folder structure",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = (dbFolders: any[]): FolderItemType[] => {
    const folderMap = new Map();
    const rootFolders: FolderItemType[] = [];

    // Create folder items
    dbFolders.forEach(folder => {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parentId: folder.parent_id,
        children: []
      });
    });

    // Build tree structure
    dbFolders.forEach(folder => {
      const folderItem = folderMap.get(folder.id);
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderItem);
        }
      } else {
        rootFolders.push(folderItem);
      }
    });

    return rootFolders;
  };

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

  // Navigate to a specific folder
  const navigateToFolder = (folderId: string | null) => {
    if (folderId) {
      setNavigationStack(prev => [...prev, folderId]);
      setCurrentFolderId(folderId);
      onFolderSelect(folderId);
    } else {
      setNavigationStack([]);
      setCurrentFolderId(null);
      onFolderSelect(null);
    }
  };

  // Navigate back to parent folder
  const navigateBack = () => {
    if (navigationStack.length <= 1) {
      setNavigationStack([]);
      setCurrentFolderId(null);
      onFolderSelect(null);
      return;
    }

    const newStack = navigationStack.slice(0, -1);
    const parentFolderId = newStack.length > 0 ? newStack[newStack.length - 1] : null;
    setNavigationStack(newStack);
    setCurrentFolderId(parentFolderId);
    onFolderSelect(parentFolderId);
  };

  // Add a new folder
  const addFolder = async (newFolderName: string, parentId: string | null) => {
    if (!currentCompany?.id) return;
    
    try {
      await documentFolderService.createFolder(currentCompany.id, newFolderName, parentId || currentFolderId);
      await loadFolders();
      toast({
        title: "Folder created",
        description: `Folder "${newFolderName}" has been created successfully.`
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

  // Edit folder name
  const editFolder = async (folderId: string, newName: string) => {
    try {
      await documentFolderService.updateFolder(folderId, newName);
      await loadFolders();
      toast({
        title: "Folder renamed",
        description: `Folder has been renamed to "${newName}".`
      });
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: "Error renaming folder",
        description: "Failed to rename folder",
        variant: "destructive"
      });
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    try {
      await documentFolderService.deleteFolder(folderId);
      await loadFolders();
      
      if (currentFolderId === folderId) {
        navigateBack();
      }
      
      toast({
        title: "Folder deleted",
        description: "Folder has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error deleting folder",
        description: "Failed to delete folder",
        variant: "destructive"
      });
    }
  };

  // Open dialog to add a new folder
  const openAddFolderDialog = (parentId: string | null = null) => {
    setCurrentParentId(parentId || currentFolderId);
    setIsAddingFolder(true);
  };

  // Open dialog to edit a folder
  const openEditFolderDialog = (folderId: string) => {
    const findFolder = (folders: FolderItemType[], id: string): FolderItemType | null => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        const found = findFolder(folder.children, id);
        if (found) return found;
      }
      return null;
    };

    const folderToEdit = findFolder(folderStructure, folderId);
    if (folderToEdit) {
      setEditingFolderId(folderId);
      setEditingFolderName(folderToEdit.name);
      setIsEditingFolder(true);
    }
  };

  // Open dialog to delete a folder
  const openDeleteFolderDialog = (folderId: string) => {
    const findFolder = (folders: FolderItemType[], id: string): FolderItemType | null => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        const found = findFolder(folder.children, id);
        if (found) return found;
      }
      return null;
    };

    const folderToDelete = findFolder(folderStructure, folderId);
    if (folderToDelete) {
      setDeletingFolderId(folderId);
      setDeletingFolderName(folderToDelete.name);
      setIsDeletingFolder(true);
    }
  };

  // Create a synchronous wrapper for getFolderPath
  const getFolderPathSync = (folderId: string | null): string[] => {
    if (!folderId) return ["All Documents"];
    
    // Build path from folder structure in memory
    const buildPath = (folders: FolderItemType[], targetId: string, currentPath: string[] = []): string[] => {
      for (const folder of folders) {
        const newPath = [...currentPath, folder.name];
        if (folder.id === targetId) {
          return newPath;
        }
        if (folder.children.length > 0) {
          const found = buildPath(folder.children, targetId, newPath);
          if (found.length > 0) {
            return found;
          }
        }
      }
      return [];
    };

    const path = buildPath(folderStructure, folderId);
    return path.length > 0 ? path : ["Unknown Folder"];
  };

  const currentFolders = getCurrentFolderContents();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading folders...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {currentFolderId && (
            <Button variant="outline" onClick={navigateBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Button onClick={() => openAddFolderDialog(currentFolderId)} className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4" />
            {currentFolderId ? "New Subfolder" : "New Folder"}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentFolders.map(folder => (
          <FolderTile
            key={folder.id}
            folder={folder}
            isSelected={selectedFolderId === folder.id}
            onFolderSelect={() => navigateToFolder(folder.id)}
            onEditFolder={openEditFolderDialog}
            onAddSubfolder={openAddFolderDialog}
            onDeleteFolder={openDeleteFolderDialog}
          />
        ))}
      </div>
      
      {currentFolders.length === 0 && (
        <Card className="p-12 text-center">
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
        </Card>
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
  );
}

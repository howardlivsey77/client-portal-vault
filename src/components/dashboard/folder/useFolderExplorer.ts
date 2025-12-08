
import { useState, useEffect } from "react";
import { documentFolderService } from "@/services";
import { FolderItem as FolderItemType } from "../types/folder.types";
import { useCompany } from "@/providers/CompanyProvider";
import { toast } from "@/hooks";

export function useFolderExplorer(onFolderSelect: (folderId: string | null) => void) {
  const { currentCompany } = useCompany();
  const [folderStructure, setFolderStructure] = useState<FolderItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>([]);

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

  // Find folder by ID in the structure
  const findFolder = (folders: FolderItemType[], id: string): FolderItemType | null => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      const found = findFolder(folder.children, id);
      if (found) return found;
    }
    return null;
  };

  return {
    folderStructure,
    loading,
    currentFolderId,
    navigationStack,
    getCurrentFolderContents,
    navigateToFolder,
    navigateBack,
    addFolder,
    editFolder,
    handleDeleteFolder,
    getFolderPathSync,
    findFolder
  };
}

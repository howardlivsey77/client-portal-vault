import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Folder, FolderPlus } from "lucide-react";
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

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
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

    // If the currently selected folder is being deleted, select "All Documents"
    if (selectedFolderId === folderId) {
      onFolderSelect(null);
    }
  };

  // Open dialog to add a new folder
  const openAddFolderDialog = (parentId: string | null = null) => {
    setCurrentParentId(parentId);
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

  // Flatten folder structure to display as tiles
  const getFlattenedFolders = (folders: FolderItemType[], parentPath = ""): FolderItemType[] => {
    return folders.map(folder => ({
      ...folder,
      path: parentPath ? `${parentPath} / ${folder.name}` : folder.name
    }));
  };
  const flatFolders = getFlattenedFolders(folderStructure);
  return;
}
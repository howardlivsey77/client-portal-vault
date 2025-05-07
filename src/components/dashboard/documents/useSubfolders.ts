
import { useState, useEffect } from "react";
import { FolderItem } from "../types/folder.types";
import { findFolderById, loadFolderStructure } from "../folder/folderService";

export function useSubfolders(selectedFolderId: string | null) {
  const [subfolders, setSubfolders] = useState<FolderItem[]>([]);

  // Load subfolders when the selected folder changes
  useEffect(() => {
    if (selectedFolderId) {
      const folderStructure = loadFolderStructure();
      const currentFolder = findFolderById(folderStructure, selectedFolderId);
      if (currentFolder && currentFolder.children) {
        setSubfolders(currentFolder.children);
      } else {
        setSubfolders([]);
      }
    } else {
      setSubfolders([]);
    }
  }, [selectedFolderId]);

  return subfolders;
}

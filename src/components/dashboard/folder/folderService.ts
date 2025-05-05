
import { FolderItem } from "../types/folder.types";

// Load folders from localStorage
export const loadFolderStructure = (): FolderItem[] => {
  const savedFolders = localStorage.getItem('documentFolders');
  if (savedFolders) {
    try {
      return JSON.parse(savedFolders);
    } catch (e) {
      console.error('Error parsing saved folders', e);
    }
  }
  
  // Default folder structure if nothing is saved
  return [
    { id: 'contracts', name: 'Contracts', parentId: null, children: [] },
    { id: 'reports', name: 'Reports', parentId: null, children: [] },
    { id: 'invoices', name: 'Invoices', parentId: null, children: [] }
  ];
};

// Save folders to localStorage
export const saveFolderStructure = (folderStructure: FolderItem[]): void => {
  localStorage.setItem('documentFolders', JSON.stringify(folderStructure));
};

// Get path of folder by ID
export const getFolderPathById = (
  folderStructure: FolderItem[],
  folderId: string | null
): string[] => {
  if (!folderId) return ["All Documents"];
  
  const findPath = (folders: FolderItem[], id: string, path: string[] = []): string[] | null => {
    for (const folder of folders) {
      if (folder.id === id) {
        return [...path, folder.name];
      }
      
      if (folder.children.length > 0) {
        const childPath = findPath(folder.children, id, [...path, folder.name]);
        if (childPath) return childPath;
      }
    }
    return null;
  };
  
  let path: string[] = [];
  for (const rootFolder of folderStructure) {
    if (rootFolder.id === folderId) {
      path = [rootFolder.name];
      break;
    }
    
    const childPath = findPath(rootFolder.children, folderId, [rootFolder.name]);
    if (childPath) {
      path = childPath;
      break;
    }
  }
  
  return path.length > 0 ? path : ["Unknown Folder"];
};

// Add a subfolder to a parent folder
export const addSubFolder = (
  folders: FolderItem[], 
  parentId: string, 
  newFolder: FolderItem
): FolderItem[] => {
  return folders.map(folder => {
    if (folder.id === parentId) {
      return {
        ...folder,
        children: [...folder.children, newFolder]
      };
    } else if (folder.children.length > 0) {
      return {
        ...folder,
        children: addSubFolder(folder.children, parentId, newFolder)
      };
    }
    return folder;
  });
};

// Update folder name by ID
export const updateFolderName = (
  folders: FolderItem[], 
  id: string, 
  newName: string
): FolderItem[] => {
  return folders.map(folder => {
    if (folder.id === id) {
      return { ...folder, name: newName.trim() };
    }
    if (folder.children.length > 0) {
      return {
        ...folder,
        children: updateFolderName(folder.children, id, newName)
      };
    }
    return folder;
  });
};

// Find a folder by ID
export const findFolderById = (
  folders: FolderItem[], 
  id: string
): FolderItem | null => {
  for (const folder of folders) {
    if (folder.id === id) {
      return folder;
    }
    if (folder.children.length > 0) {
      const childResult = findFolderById(folder.children, id);
      if (childResult) return childResult;
    }
  }
  return null;
};

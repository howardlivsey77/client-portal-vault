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

// Delete folder by ID
export const deleteFolder = (
  folders: FolderItem[],
  id: string
): FolderItem[] => {
  // First, handle root level folders
  const filteredFolders = folders.filter(folder => folder.id !== id);
  
  // If the length is the same, the folder was not at the root level
  if (filteredFolders.length === folders.length) {
    // Look in each folder's children
    return folders.map(folder => ({
      ...folder,
      children: deleteFolder(folder.children, id)
    }));
  }
  
  return filteredFolders;
};

// Update documents to remove folderId reference when a folder is deleted
export const updateDocumentsAfterFolderDeletion = (folderId: string): void => {
  try {
    const savedDocs = localStorage.getItem('documents');
    if (savedDocs) {
      const documents = JSON.parse(savedDocs);
      const updatedDocs = documents.map((doc: any) => {
        if (doc.folderId === folderId) {
          return { ...doc, folderId: null };
        }
        return doc;
      });
      localStorage.setItem('documents', JSON.stringify(updatedDocs));
    }
  } catch (e) {
    console.error('Error updating documents after folder deletion', e);
  }
};

// Edit folder name globally (exposed to window)
export const editFolderName = (folderId: string, newName: string): void => {
  try {
    const savedFolders = localStorage.getItem('documentFolders');
    if (savedFolders) {
      const folders = JSON.parse(savedFolders);
      const updatedFolders = updateFolderName(folders, folderId, newName);
      localStorage.setItem('documentFolders', JSON.stringify(updatedFolders));
    }
  } catch (e) {
    console.error('Error updating folder name', e);
  }
};

// Attach to window for global access
if (typeof window !== 'undefined') {
  window.editFolderName = editFolderName;
}

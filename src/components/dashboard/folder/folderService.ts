
import { DatabaseFolder } from "@/types/documents";
import { documentFolderService } from "@/services";

// Convert DatabaseFolder to FolderItem format for compatibility
const convertToFolderItem = (dbFolder: DatabaseFolder, allFolders: DatabaseFolder[]) => {
  const children = allFolders
    .filter(f => f.parent_id === dbFolder.id)
    .map(child => convertToFolderItem(child, allFolders));

  return {
    id: dbFolder.id,
    name: dbFolder.name,
    parentId: dbFolder.parent_id,
    children
  };
};

// Load folders from database
export const loadFolderStructure = async (companyId: string) => {
  try {
    const dbFolders = await documentFolderService.getFolders(companyId);
    const rootFolders = dbFolders.filter(f => f.parent_id === null);
    return rootFolders.map(folder => convertToFolderItem(folder, dbFolders));
  } catch (error) {
    console.error('Error loading folder structure:', error);
    // Return empty structure if database fails
    return [];
  }
};

// Save folders to database (this is now handled by individual operations)
export const saveFolderStructure = (folderStructure: any[]): void => {
  // This function is kept for compatibility but operations are now handled individually
  console.log('Folder structure is now automatically saved to database');
};

// Get path of folder by ID
export const getFolderPathById = async (
  companyId: string,
  folderId: string | null
): Promise<string[]> => {
  try {
    return await documentFolderService.getFolderPath(folderId);
  } catch (error) {
    console.error('Error getting folder path:', error);
    return folderId ? ["Unknown Folder"] : ["All Documents"];
  }
};

// Add a subfolder to a parent folder
export const addSubFolder = async (
  companyId: string,
  parentId: string,
  name: string
): Promise<void> => {
  try {
    await documentFolderService.createFolder(companyId, name, parentId);
  } catch (error) {
    console.error('Error creating subfolder:', error);
    throw error;
  }
};

// Update folder name by ID
export const updateFolderName = async (
  folderId: string,
  newName: string
): Promise<void> => {
  try {
    await documentFolderService.updateFolder(folderId, newName);
  } catch (error) {
    console.error('Error updating folder name:', error);
    throw error;
  }
};

// Delete folder by ID
export const deleteFolder = async (folderId: string): Promise<void> => {
  try {
    await documentFolderService.deleteFolder(folderId);
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// Legacy functions for compatibility
export const findFolderById = (folders: any[], id: string) => {
  // This is now handled by database queries
  return null;
};

export const updateDocumentsAfterFolderDeletion = (folderId: string): void => {
  // This is now handled automatically by the database CASCADE rules
};

export const editFolderName = async (folderId: string, newName: string): Promise<void> => {
  await updateFolderName(folderId, newName);
};

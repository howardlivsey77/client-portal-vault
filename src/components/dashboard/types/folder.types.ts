
export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderItem[];
}

export interface FolderExplorerProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

// Extend Window interface to include our global methods
declare global {
  interface Window {
    editFolderName?: (folderId: string, newName: string) => void;
  }
}

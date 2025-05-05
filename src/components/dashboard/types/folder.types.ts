
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

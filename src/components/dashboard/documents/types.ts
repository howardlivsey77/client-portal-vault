
export interface DocumentGridHeaderProps {
  selectedFolderId: string | null;
  onNavigateBack?: () => void;
  folderPath?: string[];
  onAddDocument: () => void;
  onAddFolder?: () => void;
}

export interface DocumentGridProps {
  onAddDocument: () => void;
  selectedFolderId: string | null;
  onNavigateBack?: () => void;
  folderPath?: string[];
  onFolderSelect?: (folderId: string) => void;
  onAddFolder?: () => void;
}

export interface EmptyFolderProps {
  // Removed onAddDocument since we'll handle this in the header
}

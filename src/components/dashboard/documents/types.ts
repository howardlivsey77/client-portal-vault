
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

export interface Document {
  id: string;
  title: string;
  type: string;
  updatedAt: string;
  size: string;
  folderId: string | null;
}

export interface DocumentListProps {
  documents: Document[];
}

export interface SubfolderListProps {
  subfolders: Array<{
    id: string;
    name: string;
    parent_id: string | null;
  }>;
  onFolderSelect?: (folderId: string) => void;
}

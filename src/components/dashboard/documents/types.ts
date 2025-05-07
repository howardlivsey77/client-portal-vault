
import { FolderItem } from "../types/folder.types";

export interface Document {
  id: string;
  title: string;
  type: string;
  updatedAt: string;
  size: string;
  folderId: string | null;
}

export interface DocumentGridProps {
  onAddDocument: () => void;
  selectedFolderId: string | null;
  onNavigateBack?: () => void;
  folderPath?: string[];
  onFolderSelect?: (folderId: string) => void;
}

export interface EmptyFolderProps {
  onAddDocument: () => void;
}

export interface DocumentListProps {
  documents: Document[];
}

export interface DocumentGridHeaderProps {
  selectedFolderId: string | null;
  onNavigateBack?: () => void;
  folderPath?: string[];
  onAddDocument: () => void;
}

export interface SubfolderListProps {
  subfolders: FolderItem[];
  onFolderSelect: (folderId: string) => void;
}


import { Document } from "../types";

export interface DocumentCardProps extends Document {
  icon?: React.ReactNode;
  className?: string;
}

export interface DocumentCardHeaderProps {
  title: string;
  updatedAt: string;
  size: string;
  icon?: React.ReactNode;
}

export interface DocumentCardFooterProps {
  type: string;
  documentId: string;
  filePath: string;
  title: string;
}

export interface DocumentCardMenuProps {
  documentId: string;
  filePath: string;
  title: string;
  onRename: () => void;
  onDelete: () => void;
}

export interface DocumentCardDialogsProps {
  documentId: string;
  documentTitle: string;
  renameDialogOpen: boolean;
  deleteDialogOpen: boolean;
  newTitle: string;
  onRenameDialogChange: (open: boolean) => void;
  onDeleteDialogChange: (open: boolean) => void;
  onNewTitleChange: (title: string) => void;
  onConfirmRename: () => void;
  onConfirmDelete: () => void;
}

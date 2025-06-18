
import { FolderTile } from "./FolderItem";
import { FolderItem as FolderItemType } from "../types/folder.types";

interface FolderGridProps {
  folders: FolderItemType[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string) => void;
  onEditFolder: (folderId: string) => void;
  onAddSubfolder: (parentId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function FolderGrid({
  folders,
  selectedFolderId,
  onFolderSelect,
  onEditFolder,
  onAddSubfolder,
  onDeleteFolder
}: FolderGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {folders.map(folder => (
        <FolderTile
          key={folder.id}
          folder={folder}
          isSelected={selectedFolderId === folder.id}
          onFolderSelect={() => onFolderSelect(folder.id)}
          onEditFolder={onEditFolder}
          onAddSubfolder={onAddSubfolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  );
}

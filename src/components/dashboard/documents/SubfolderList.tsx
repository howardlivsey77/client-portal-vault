
import { FolderTile } from "../folder/FolderItem";
import { SubfolderListProps } from "./types";

export function SubfolderList({ subfolders, onFolderSelect }: SubfolderListProps) {
  if (subfolders.length === 0) return null;
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Folders</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {subfolders.map(folder => (
          <FolderTile
            key={folder.id}
            folder={folder}
            isSelected={false}
            onFolderSelect={onFolderSelect}
            onEditFolder={() => {}}
            onAddSubfolder={() => {}}
            onDeleteFolder={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

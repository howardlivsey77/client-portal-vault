
import { useState } from "react";
import { FolderTile } from "../folder/FolderItem";
import { EditFolderDialog } from "../folder/EditFolderDialog";
import { SubfolderListProps } from "./types";

export function SubfolderList({ subfolders, onFolderSelect }: SubfolderListProps) {
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  if (subfolders.length === 0) return null;
  
  // Handle opening the edit folder dialog
  const openEditFolderDialog = (folderId: string) => {
    const folderToEdit = subfolders.find(folder => folder.id === folderId);
    if (folderToEdit) {
      setEditingFolderId(folderId);
      setEditingFolderName(folderToEdit.name);
      setIsEditingFolder(true);
    }
  };

  // Handle folder name edit submission
  const handleEditFolder = (folderId: string, newName: string) => {
    if (window.editFolderName) {
      window.editFolderName(folderId, newName);
    }
  };
  
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
            onEditFolder={openEditFolderDialog}
            onAddSubfolder={() => {}}
            onDeleteFolder={() => {}}
          />
        ))}
      </div>

      <EditFolderDialog
        open={isEditingFolder}
        onOpenChange={setIsEditingFolder}
        folderId={editingFolderId}
        folderName={editingFolderName}
        onEditFolder={handleEditFolder}
      />
    </div>
  );
}

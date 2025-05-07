
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Folder, FolderPlus } from "lucide-react";
import { AddFolderDialog } from "./folder/AddFolderDialog";
import { EditFolderDialog } from "./folder/EditFolderDialog";
import { 
  loadFolderStructure, 
  saveFolderStructure, 
  getFolderPathById,
  addSubFolder,
  updateFolderName,
  findFolderById
} from "./folder/folderService";
import { FolderItem as FolderItemType, FolderExplorerProps } from "./types/folder.types";
import { FolderTile } from "./folder/FolderItem";
import { Card } from "@/components/ui/card";

export { type FolderItem } from "./types/folder.types";

export function FolderExplorer({ onFolderSelect, selectedFolderId }: FolderExplorerProps) {
  const [folderStructure, setFolderStructure] = useState<FolderItemType[]>(loadFolderStructure);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  // States for folder creation
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  
  // States for folder editing
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  
  // Save folder structure to localStorage whenever it changes
  useEffect(() => {
    saveFolderStructure(folderStructure);
  }, [folderStructure]);
  
  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  // Add a new folder
  const addFolder = (newFolderName: string, parentId: string | null) => {
    const newFolder: FolderItemType = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      parentId: parentId,
      children: []
    };
    
    // If it's a root level folder
    if (!parentId) {
      setFolderStructure([...folderStructure, newFolder]);
    } else {
      // If it's a subfolder
      const updatedStructure = addSubFolder(folderStructure, parentId, newFolder);
      setFolderStructure(updatedStructure);
      
      // Ensure the parent folder is expanded
      setExpandedFolders(prev => ({
        ...prev,
        [parentId]: true
      }));
    }
  };
  
  // Edit folder name
  const editFolder = (folderId: string, newName: string) => {
    const updatedStructure = updateFolderName(folderStructure, folderId, newName);
    setFolderStructure(updatedStructure);
  };
  
  // Open dialog to add a new folder
  const openAddFolderDialog = (parentId: string | null = null) => {
    setCurrentParentId(parentId);
    setIsAddingFolder(true);
  };
  
  // Open dialog to edit a folder
  const openEditFolderDialog = (folderId: string) => {
    const folderToEdit = findFolderById(folderStructure, folderId);
    if (folderToEdit) {
      setEditingFolderId(folderId);
      setEditingFolderName(folderToEdit.name);
      setIsEditingFolder(true);
    }
  };
  
  // Get folder path for display
  const getFolderPath = (folderId: string | null): string[] => {
    return getFolderPathById(folderStructure, folderId);
  };
  
  // Flatten folder structure to display as tiles
  const getFlattenedFolders = (folders: FolderItemType[], parentPath = ""): FolderItemType[] => {
    return folders.map(folder => ({
      ...folder,
      path: parentPath ? `${parentPath} / ${folder.name}` : folder.name
    }));
  };

  const flatFolders = getFlattenedFolders(folderStructure);
  
  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Folders</h3>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 px-2 text-xs"
          onClick={() => openAddFolderDialog()}
        >
          <FolderPlus className="h-3 w-3 mr-1" />
          New Folder
        </Button>
      </div>
      
      {/* All Documents "Tile" */}
      <Card
        className={`cursor-pointer p-4 flex flex-col items-center justify-center transition-all ${!selectedFolderId ? 'bg-muted' : 'hover:bg-muted/50'}`}
        onClick={() => onFolderSelect(null)}
      >
        <Folder className="h-12 w-12 mb-2 text-blue-500" />
        <span className="text-sm font-medium">All Documents</span>
      </Card>
      
      {/* Grid of folder tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {flatFolders.map(folder => (
          <FolderTile
            key={folder.id}
            folder={folder}
            isSelected={selectedFolderId === folder.id}
            onFolderSelect={onFolderSelect}
            onEditFolder={openEditFolderDialog}
            onAddSubfolder={openAddFolderDialog}
          />
        ))}
      </div>
      
      {/* Folder breadcrumb */}
      {selectedFolderId && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-4">
          <span>Path:</span>
          {getFolderPath(selectedFolderId).map((name, i, arr) => (
            <span key={i}>
              {name}
              {i < arr.length - 1 && <span className="mx-1">/</span>}
            </span>
          ))}
        </div>
      )}
      
      {/* Add folder dialog */}
      <AddFolderDialog
        open={isAddingFolder}
        onOpenChange={setIsAddingFolder}
        parentId={currentParentId}
        onAddFolder={addFolder}
        getFolderPath={getFolderPath}
      />
      
      {/* Edit folder dialog */}
      <EditFolderDialog
        open={isEditingFolder}
        onOpenChange={setIsEditingFolder}
        folderId={editingFolderId}
        folderName={editingFolderName}
        onEditFolder={editFolder}
      />
    </div>
  );
}


import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Pencil,
  FolderPlus,
  MoreVertical,
  Trash,
  Folder
} from "lucide-react";
import { FolderItem as FolderItemType } from "../types/folder.types";

interface FolderTileProps {
  folder: FolderItemType;
  isSelected: boolean;
  onFolderSelect: (folderId: string) => void;
  onEditFolder: (folderId: string) => void;
  onAddSubfolder: (parentId: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function FolderTile({
  folder,
  isSelected,
  onFolderSelect,
  onEditFolder,
  onAddSubfolder,
  onDeleteFolder
}: FolderTileProps) {
  return (
    <Card
      className={`relative group cursor-pointer aspect-square flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'}`}
      onClick={() => onFolderSelect(folder.id)}
    >
      <Folder className="h-16 w-16 text-blue-500 mb-4" />
      <span className="text-xl font-medium text-center">{folder.name}</span>
      
      {/* Dropdown for folder actions - visible on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-3 w-3" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onEditFolder(folder.id);
            }}>
              <Pencil className="h-3 w-3 mr-2" />
              Rename Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onAddSubfolder(folder.id);
            }}>
              <FolderPlus className="h-3 w-3 mr-2" />
              Add Subfolder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder.id);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash className="h-3 w-3 mr-2" />
              Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Display a badge showing number of subfolders/files if any */}
      {folder.children && folder.children.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-0.5">
          {folder.children.length}
        </div>
      )}
    </Card>
  );
}

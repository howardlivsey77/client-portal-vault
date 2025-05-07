
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Folder,
  Pencil,
  FolderPlus,
  MoreVertical,
} from "lucide-react";
import { FolderItem as FolderItemType } from "../types/folder.types";

interface FolderTileProps {
  folder: FolderItemType;
  isSelected: boolean;
  onFolderSelect: (folderId: string) => void;
  onEditFolder: (folderId: string) => void;
  onAddSubfolder: (parentId: string) => void;
}

export function FolderTile({
  folder,
  isSelected,
  onFolderSelect,
  onEditFolder,
  onAddSubfolder
}: FolderTileProps) {
  return (
    <Card
      className={`relative group cursor-pointer p-4 flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'}`}
      onClick={() => onFolderSelect(folder.id)}
    >
      <Folder className={`h-12 w-12 mb-2 ${isSelected ? 'text-blue-500' : 'text-gray-500'}`} />
      <span className="text-sm font-medium text-center">{folder.name}</span>
      
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Display a badge showing number of subfolders if any */}
      {folder.children && folder.children.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-full px-2 py-0.5">
          {folder.children.length}
        </div>
      )}
    </Card>
  );
}

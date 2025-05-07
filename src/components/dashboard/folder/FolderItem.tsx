import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  MoreVertical, 
  Pencil,
  FolderPlus
} from "lucide-react";
import { FolderItem as FolderItemType } from "../types/folder.types";
import { Card } from "@/components/ui/card";

interface FolderItemProps {
  folder: FolderItemType;
  level: number;
  selectedFolderId: string | null;
  expandedFolders: Record<string, boolean>;
  onFolderSelect: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onEditFolder: (folderId: string) => void;
  onAddSubfolder: (parentId: string) => void;
  displayAsTiles?: boolean;
}

export function FolderItem({
  folder,
  level,
  selectedFolderId,
  expandedFolders,
  onFolderSelect,
  onToggleFolder,
  onEditFolder,
  onAddSubfolder,
  displayAsTiles = false
}: FolderItemProps) {
  const renderFolderItems = (folders: FolderItemType[], currentLevel: number) => {
    return (
      <>
        {folders.map(subFolder => (
          <FolderItem
            key={subFolder.id}
            folder={subFolder}
            level={currentLevel}
            selectedFolderId={selectedFolderId}
            expandedFolders={expandedFolders}
            onFolderSelect={onFolderSelect}
            onToggleFolder={onToggleFolder}
            onEditFolder={onEditFolder}
            onAddSubfolder={onAddSubfolder}
            displayAsTiles={displayAsTiles}
          />
        ))}
      </>
    );
  };

  // If displaying as tiles, render a folder card
  if (displayAsTiles) {
    return (
      <>
        <Card 
          className={`group cursor-pointer transition-all hover:shadow-md ${selectedFolderId === folder.id ? 'ring-2 ring-primary' : ''}`}
          onClick={() => onFolderSelect(folder.id)}
        >
          <div className="p-4 flex flex-col items-center text-center">
            {selectedFolderId === folder.id ? 
              <FolderOpen className="h-16 w-16 text-blue-500 mb-2" /> : 
              <Folder className="h-16 w-16 text-blue-400 mb-2" />
            }
            <p className="font-medium line-clamp-1">{folder.name}</p>
            <div className="text-xs text-muted-foreground mt-1">
              {folder.children.length} {folder.children.length === 1 ? 'subfolder' : 'subfolders'}
            </div>
          </div>
          <div className="flex items-center justify-end border-t p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditFolder(folder.id); }}>
                  <Pencil className="h-3 w-3 mr-2" />
                  Rename Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddSubfolder(folder.id); }}>
                  <FolderPlus className="h-3 w-3 mr-2" />
                  Add Subfolder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
        
        {expandedFolders[folder.id] && folder.children.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 ml-4">
            {renderFolderItems(folder.children, level + 1)}
          </div>
        )}
      </>
    );
  }

  // Otherwise, render the original list view
  return (
    <div key={folder.id} className="pl-2">
      <div 
        className={`flex items-center py-1 px-1 rounded-md ${selectedFolderId === folder.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 p-0 mr-1" 
          onClick={() => onToggleFolder(folder.id)}
        >
          {folder.children.length > 0 ? (
            expandedFolders[folder.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="w-4" />
          )}
        </Button>
        
        <div 
          className="flex flex-1 items-center space-x-2 cursor-pointer" 
          onClick={() => onFolderSelect(folder.id)}
          style={{ paddingLeft: `${level * 4}px` }}
        >
          {selectedFolderId === folder.id ? 
            <FolderOpen className="h-4 w-4 text-blue-500" /> : 
            <Folder className="h-4 w-4" />
          }
          <span className="text-sm">{folder.name}</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-3 w-3" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditFolder(folder.id)}>
              <Pencil className="h-3 w-3 mr-2" />
              Rename Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSubfolder(folder.id)}>
              <FolderPlus className="h-3 w-3 mr-2" />
              Add Subfolder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {expandedFolders[folder.id] && folder.children.length > 0 && (
        <div className="ml-4">
          {renderFolderItems(folder.children, level + 1)}
        </div>
      )}
    </div>
  );
}

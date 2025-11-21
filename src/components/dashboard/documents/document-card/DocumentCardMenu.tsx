
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Download, 
  MoreVertical, 
  Share,
  Trash2,
  FolderOpen,
  Edit
} from "lucide-react";
import { FolderItem } from "../../types/folder.types";
import { DocumentCardMenuProps } from "./types";
import { moveToFolder, downloadDocument } from "./utils";

export function DocumentCardMenu({ documentId, filePath, title, onRename, onDelete }: DocumentCardMenuProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);

  // Load folder structure from localStorage
  useEffect(() => {
    const savedFolders = localStorage.getItem('documentFolders');
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders));
      } catch (e) {
        console.error('Error parsing saved folders', e);
      }
    }
  }, []);

  const handleDownload = () => {
    downloadDocument(filePath, title);
  };

  // Recursive function to render folder items in the dropdown menu
  const renderFolderItems = (folderList: FolderItem[]) => {
    return folderList.map(folder => (
      <DropdownMenuItem 
        key={folder.id}
        onClick={() => moveToFolder(documentId, folder.id)}
      >
        {folder.name}
        {folder.children.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="ml-auto">
              <FolderOpen className="h-4 w-4 ml-2" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {renderFolderItems(folder.children)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuItem>
    ));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          <span>Download</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share className="mr-2 h-4 w-4" />
          <span>Share</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRename}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>Move to folder</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => moveToFolder(documentId, null)}>
              All Documents
            </DropdownMenuItem>
            {renderFolderItems(folders)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

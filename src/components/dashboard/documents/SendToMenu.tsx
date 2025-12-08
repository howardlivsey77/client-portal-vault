import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderOpen, Send } from "lucide-react";
import { DatabaseFolder } from "@/types/documents";
import { documentFolderService } from "@/services/documents";

interface SendToMenuProps {
  documentId: string;
  currentFolderId?: string | null;
  onMove: (documentId: string, targetFolderId: string | null) => void;
  disabled?: boolean;
}

interface FolderTreeItem extends DatabaseFolder {
  children: FolderTreeItem[];
}

export function SendToMenu({ documentId, currentFolderId, onMove, disabled }: SendToMenuProps) {
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoading(true);
    try {
      // Get current company ID from localStorage or context
      const currentCompany = JSON.parse(localStorage.getItem('currentCompany') || '{}');
      if (!currentCompany.id) return;

      const allFolders = await documentFolderService.getFolders(currentCompany.id);
      const folderTree = buildFolderTree(allFolders);
      setFolders(folderTree);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = (folders: DatabaseFolder[]): FolderTreeItem[] => {
    const folderMap = new Map<string, FolderTreeItem>();
    const rootFolders: FolderTreeItem[] = [];

    // Initialize all folders with empty children arrays
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build the tree structure
    folders.forEach(folder => {
      const folderItem = folderMap.get(folder.id)!;
      
      if (folder.parent_id && folderMap.has(folder.parent_id)) {
        const parent = folderMap.get(folder.parent_id)!;
        parent.children.push(folderItem);
      } else {
        rootFolders.push(folderItem);
      }
    });

    return rootFolders;
  };

  const handleMoveToRoot = () => {
    onMove(documentId, null);
  };

  const handleMoveToFolder = (folderId: string) => {
    onMove(documentId, folderId);
  };

  const renderFolderItems = (folders: FolderTreeItem[], level = 0): JSX.Element[] => {
    return folders.map(folder => {
      const isCurrentFolder = folder.id === currentFolderId;
      const hasChildren = folder.children.length > 0;

      if (hasChildren) {
        return (
          <DropdownMenuSub key={folder.id}>
            <DropdownMenuSubTrigger 
              disabled={isCurrentFolder}
              className={isCurrentFolder ? "opacity-50" : ""}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              {folder.name}
              {isCurrentFolder && " (current)"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handleMoveToFolder(folder.id)}
                disabled={isCurrentFolder}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Move to "{folder.name}"
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {renderFolderItems(folder.children, level + 1)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }

      return (
        <DropdownMenuItem
          key={folder.id}
          onClick={() => handleMoveToFolder(folder.id)}
          disabled={isCurrentFolder}
          className={isCurrentFolder ? "opacity-50" : ""}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          {folder.name}
          {isCurrentFolder && " (current)"}
        </DropdownMenuItem>
      );
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={disabled || loading}
          className="h-8"
        >
          <Send className="mr-2 h-4 w-4" />
          Send to
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem
          onClick={handleMoveToRoot}
          disabled={currentFolderId === null}
          className={currentFolderId === null ? "opacity-50" : ""}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          All Documents {currentFolderId === null && "(current)"}
        </DropdownMenuItem>
        
        {folders.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {renderFolderItems(folders)}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
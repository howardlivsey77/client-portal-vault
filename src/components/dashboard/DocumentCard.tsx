import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Eye, 
  Download, 
  FileText, 
  MoreVertical, 
  Share,
  Trash,
  FolderOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { FolderItem } from "./types/folder.types";
import { Document } from "./documents/types";

export interface DocumentCardProps extends Document {
  icon?: React.ReactNode;
  className?: string;
}

export function DocumentCard({
  id,
  title,
  type,
  updatedAt,
  size,
  folderId,
  icon,
  className,
  ...props
}: DocumentCardProps) {
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

  const getFileIcon = () => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-8 w-8 text-green-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const moveToFolder = (targetFolderId: string | null) => {
    if (typeof window.moveDocument === 'function') {
      window.moveDocument(id, targetFolderId);
    }
  };

  // Recursive function to render folder items in the dropdown menu
  const renderFolderItems = (folderList: FolderItem[]) => {
    return folderList.map(folder => (
      <DropdownMenuItem 
        key={folder.id}
        onClick={() => moveToFolder(folder.id)}
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
    <Card
      className={cn(
        "group flex flex-col overflow-hidden transition-all hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          {icon || getFileIcon()}
          <div>
            <div className="font-medium line-clamp-1">{title}</div>
            <div className="text-sm text-muted-foreground">{updatedAt} • {size}</div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              <span>View</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="mr-2 h-4 w-4" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderOpen className="mr-2 h-4 w-4" />
                <span>Move to folder</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => moveToFolder(null)}>
                  All Documents
                </DropdownMenuItem>
                {renderFolderItems(folders)}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem className="text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-auto flex items-center justify-between border-t px-4 py-2 text-sm">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide">
          {type}
        </span>
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

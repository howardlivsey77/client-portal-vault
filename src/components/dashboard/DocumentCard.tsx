
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Eye, 
  Download, 
  FileText, 
  MoreVertical, 
  Share,
  Trash
} from "lucide-react";

export interface DocumentCardProps {
  title: string;
  type: string;
  updatedAt: string;
  size: string;
  icon?: React.ReactNode;
  className?: string;
}

export function DocumentCard({
  title,
  type,
  updatedAt,
  size,
  icon,
  className,
  ...props
}: DocumentCardProps) {
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

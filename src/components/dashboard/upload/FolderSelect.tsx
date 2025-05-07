
import { FolderItem } from "../FolderExplorer";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen } from "lucide-react";

interface FolderSelectProps {
  selectedFolder: string | null;
  folderStructure: FolderItem[];
  onFolderChange: (folderId: string) => void;
}

export function FolderSelect({
  selectedFolder,
  folderStructure,
  onFolderChange
}: FolderSelectProps) {
  // Recursively render folder options
  const renderFolderOptions = (folders: FolderItem[], level = 0) => {
    const options: JSX.Element[] = [];
    
    folders.forEach(folder => {
      options.push(
        <SelectItem key={folder.id} value={folder.id}>
          {"\u00A0".repeat(level * 2) + folder.name}
        </SelectItem>
      );
      
      if (folder.children.length > 0) {
        options.push(...renderFolderOptions(folder.children, level + 1));
      }
    });
    
    return options;
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="folder">Folder</Label>
      <Select 
        value={selectedFolder || "none"} 
        onValueChange={onFolderChange}
      >
        <SelectTrigger id="folder" className="w-full">
          <SelectValue placeholder="Select folder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center">
              <FolderOpen className="mr-2 h-4 w-4" />
              All Documents
            </div>
          </SelectItem>
          {renderFolderOptions(folderStructure)}
        </SelectContent>
      </Select>
    </div>
  );
}

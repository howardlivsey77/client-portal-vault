
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FolderSelect } from "./FolderSelect";
import { CategorySelect } from "./CategorySelect";
import { FolderItem } from "../FolderExplorer";

interface DocumentMetadataFormProps {
  title: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFolder: string | null;
  folderStructure: FolderItem[];
  onFolderChange: (folderId: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

export function DocumentMetadataForm({
  title,
  onTitleChange,
  selectedFolder,
  folderStructure,
  onFolderChange,
  category,
  onCategoryChange
}: DocumentMetadataFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="document-title">Title</Label>
        <Input 
          id="document-title" 
          placeholder="Enter document title" 
          value={title}
          onChange={onTitleChange}
        />
      </div>
      
      <FolderSelect
        selectedFolder={selectedFolder}
        folderStructure={folderStructure}
        onFolderChange={onFolderChange}
      />
      
      <CategorySelect
        category={category}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
}

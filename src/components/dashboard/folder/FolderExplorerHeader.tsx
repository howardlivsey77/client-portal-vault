
import { Button } from "@/components/ui/button";
import { FolderPlus, ArrowLeft } from "lucide-react";

interface FolderExplorerHeaderProps {
  currentFolderId: string | null;
  onNavigateBack: () => void;
  onAddFolder: () => void;
}

export function FolderExplorerHeader({
  currentFolderId,
  onNavigateBack,
  onAddFolder
}: FolderExplorerHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex gap-2">
        {currentFolderId && (
          <Button variant="outline" onClick={onNavigateBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <Button onClick={onAddFolder} className="flex items-center gap-2">
          <FolderPlus className="h-4 w-4" />
          {currentFolderId ? "New Subfolder" : "New Folder"}
        </Button>
      </div>
    </div>
  );
}

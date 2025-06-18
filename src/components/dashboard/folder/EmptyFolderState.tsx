
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FolderPlus } from "lucide-react";

interface EmptyFolderStateProps {
  currentFolderId: string | null;
  onAddFolder: () => void;
}

export function EmptyFolderState({ currentFolderId, onAddFolder }: EmptyFolderStateProps) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <h3 className="text-xl font-medium">
          {currentFolderId ? "This folder is empty" : "No folders yet"}
        </h3>
        <p className="text-muted-foreground">
          {currentFolderId ? "Create a subfolder to organize your documents" : "Create a folder to organize your documents"}
        </p>
        <Button onClick={onAddFolder}>
          <FolderPlus className="h-4 w-4 mr-2" />
          {currentFolderId ? "New Subfolder" : "New Folder"}
        </Button>
      </div>
    </Card>
  );
}

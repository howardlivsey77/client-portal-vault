
import { FolderOpen } from "lucide-react";
import { EmptyFolderProps } from "./types";

export function EmptyFolder({}: EmptyFolderProps) {
  return (
    <div className="text-center py-12 border border-dashed rounded-lg">
      <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-medium text-lg mb-2">No documents in this folder</h3>
      <p className="text-sm text-muted-foreground">
        Upload a document using the button above to get started.
      </p>
    </div>
  );
}

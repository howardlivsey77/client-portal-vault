
import { Button } from "@/components/ui/button";
import { FolderOpen, FileText } from "lucide-react";
import { EmptyFolderProps } from "./types";

export function EmptyFolder({ onAddDocument }: EmptyFolderProps) {
  return (
    <div className="text-center py-12 border border-dashed rounded-lg">
      <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-medium text-lg mb-2">No documents in this folder</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a document to get started.
      </p>
      <Button onClick={onAddDocument}>
        <FileText className="h-4 w-4 mr-2" />
        Upload Document
      </Button>
    </div>
  );
}


import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DocumentCardProps } from "./types";
import { DocumentCardHeader } from "./DocumentCardHeader";
import { DocumentCardFooter } from "./DocumentCardFooter";
import { DocumentCardMenu } from "./DocumentCardMenu";
import { DocumentCardDialogs } from "./DocumentCardDialogs";
import { renameDocument, deleteDocument } from "./utils";

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
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const handleRename = () => {
    setRenameDialogOpen(true);
    setNewTitle(title);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmRename = () => {
    renameDocument(id, newTitle);
    setRenameDialogOpen(false);
  };

  const confirmDelete = () => {
    deleteDocument(id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card
        className={cn(
          "group flex flex-col overflow-hidden transition-all hover:shadow-md",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between p-4">
          <DocumentCardHeader 
            title={title}
            updatedAt={updatedAt}
            size={size}
            icon={icon}
          />
          <DocumentCardMenu 
            documentId={id}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>
        <DocumentCardFooter type={type} />
      </Card>

      <DocumentCardDialogs
        documentId={id}
        documentTitle={title}
        renameDialogOpen={renameDialogOpen}
        deleteDialogOpen={deleteDialogOpen}
        newTitle={newTitle}
        onRenameDialogChange={setRenameDialogOpen}
        onDeleteDialogChange={setDeleteDialogOpen}
        onNewTitleChange={setNewTitle}
        onConfirmRename={confirmRename}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
}

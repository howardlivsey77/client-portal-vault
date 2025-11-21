
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DocumentCardProps } from "./types";
import { DocumentCardHeader } from "./DocumentCardHeader";
import { DocumentCardFooter } from "./DocumentCardFooter";
import { DocumentCardMenu } from "./DocumentCardMenu";
import { DocumentCardDialogs } from "./DocumentCardDialogs";
import { renameDocument, deleteDocument, downloadDocument } from "./utils";

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

  const handleCardClick = () => {
    if (!props.file_path) return;
    downloadDocument(props.file_path, title);
  };

  return (
    <>
      <Card
        className={cn(
          "group flex flex-col overflow-hidden transition-all hover:shadow-md cursor-pointer",
          className
        )}
        onClick={handleCardClick}
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
            filePath={props.file_path}
            title={title}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>
        <DocumentCardFooter 
          type={type}
          documentId={id}
          filePath={props.file_path}
          title={title}
        />
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

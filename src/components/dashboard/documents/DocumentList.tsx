
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Edit, Trash2, Download } from "lucide-react";
import { DocumentListProps } from "./types";
import { useDraggable } from "@/hooks/useDraggable";
import { cn } from "@/lib/utils";
import { SendToMenu } from "./SendToMenu";
import { downloadDocument } from "./document-card/utils";

export function DocumentList({ documents }: DocumentListProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{id: string, title: string} | null>(null);
  const [newTitle, setNewTitle] = useState("");

  if (documents.length === 0) return null;
  
  const handleRenameClick = (id: string, title: string) => {
    setSelectedDocument({ id, title });
    setNewTitle(title);
    setRenameDialogOpen(true);
  };

  const handleDeleteClick = (id: string, title: string) => {
    setSelectedDocument({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleRenameConfirm = () => {
    if (selectedDocument && window.renameDocument) {
      window.renameDocument(selectedDocument.id, newTitle);
    }
    setRenameDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (selectedDocument && window.deleteDocument) {
      window.deleteDocument(selectedDocument.id);
    }
    setDeleteDialogOpen(false);
  };

  const handleDownload = (filePath: string, title: string) => {
    if (!filePath) return;
    downloadDocument(filePath, title);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {documents.map((doc) => {
          const { isDraggingThis, dragProps } = useDraggable({
            item: {
              type: 'document',
              id: doc.id,
              title: doc.title,
              folderId: doc.folderId,
            },
          });

          return (
            <ContextMenu key={doc.id}>
              <ContextMenuTrigger>
                <Card 
                  {...dragProps}
                  onClick={() => handleDownload(doc.file_path, doc.title)}
                  className={cn(
                    "p-4 flex justify-between items-center hover:bg-accent/5 cursor-pointer transition-all",
                    isDraggingThis && "opacity-50 scale-95",
                    "select-none"
                  )}
                >
                <div className="flex items-center">
                  <div className={`p-2 rounded-md mr-3 ${
                    doc.type === 'PDF' ? 'bg-red-100' : 
                    doc.type === 'DOCX' ? 'bg-blue-100' : 
                    doc.type === 'XLSX' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <FileText className={`h-6 w-6 ${
                      doc.type === 'PDF' ? 'text-red-500' : 
                      doc.type === 'DOCX' ? 'text-blue-500' : 
                      doc.type === 'XLSX' ? 'text-green-500' : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-medium">{doc.title}</h3>
                    <div className="text-sm text-muted-foreground">
                      {doc.type} • {doc.size} • Updated {doc.updatedAt}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <SendToMenu
                    documentId={doc.id}
                    currentFolderId={doc.folderId}
                    onMove={(docId, targetFolderId) => {
                      if (window.moveDocument) {
                        window.moveDocument(docId, targetFolderId);
                      }
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.file_path, doc.title);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameClick(doc.id, doc.title);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Rename</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(doc.id, doc.title);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
                </Card>
              </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleDownload(doc.file_path, doc.title)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleRenameClick(doc.id, doc.title)}>
                <Edit className="mr-2 h-4 w-4" />
                Rename
              </ContextMenuItem>
              <ContextMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => handleDeleteClick(doc.id, doc.title)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              Enter a new name for this document.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Document name"
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document "{selectedDocument?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { DocumentCardDialogsProps } from "./types";

export function DocumentCardDialogs({
  documentId,
  documentTitle,
  renameDialogOpen,
  deleteDialogOpen,
  newTitle,
  onRenameDialogChange,
  onDeleteDialogChange,
  onNewTitleChange,
  onConfirmRename,
  onConfirmDelete
}: DocumentCardDialogsProps) {
  return (
    <>
      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={onRenameDialogChange}>
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
              onChange={(e) => onNewTitleChange(e.target.value)}
              placeholder="Document name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onRenameDialogChange(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirmRename}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document "{documentTitle}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={onConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

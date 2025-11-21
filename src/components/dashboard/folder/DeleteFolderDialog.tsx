
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Trash } from "lucide-react";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  folderName: string;
  onDeleteFolder: (folderId: string) => void;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderId,
  folderName,
  onDeleteFolder
}: DeleteFolderDialogProps) {
  
  const handleDeleteFolder = async () => {
    if (!folderId) return;
    
    try {
      await onDeleteFolder(folderId);
      onOpenChange(false);
    } catch (error) {
      // Error toast already shown by useFolderExplorer hook
      // Keep dialog open so user can retry
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Folder</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{folderName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 flex items-center justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <Trash className="h-6 w-6 text-red-600" />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            variant="destructive" 
            onClick={handleDeleteFolder}
          >
            Delete Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

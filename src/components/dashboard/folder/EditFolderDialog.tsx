
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  folderName: string;
  onEditFolder: (folderId: string, newName: string) => void;
}

export function EditFolderDialog({ 
  open, 
  onOpenChange, 
  folderId, 
  folderName, 
  onEditFolder 
}: EditFolderDialogProps) {
  // Track folder name in local state
  const [editingFolderName, setEditingFolderName] = useState(folderName);
  
  // Immediately update internal state when the dialog opens with a new folder
  useEffect(() => {
    if (open) {
      setEditingFolderName(folderName);
    }
  }, [folderName, open]);

  const handleSaveFolder = () => {
    if (!folderId || !editingFolderName.trim()) return;
    
    onEditFolder(folderId, editingFolderName.trim());
    
    toast({
      title: "Folder renamed",
      description: `Folder has been renamed to "${editingFolderName.trim()}".`
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>
            Enter a new name for this folder
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Input 
            value={editingFolderName} 
            onChange={(e) => setEditingFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSaveFolder} disabled={!editingFolderName.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

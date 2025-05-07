
import { useState } from "react";
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

interface AddFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
  onAddFolder: (name: string, parentId: string | null) => void;
  getFolderPath?: (folderId: string | null) => string[];
}

export function AddFolderDialog({ 
  open, 
  onOpenChange, 
  parentId, 
  onAddFolder, 
  getFolderPath = () => [] 
}: AddFolderDialogProps) {
  const [newFolderName, setNewFolderName] = useState("");
  
  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    
    onAddFolder(newFolderName.trim(), parentId);
    
    toast({
      title: "Folder created",
      description: `Folder "${newFolderName.trim()}" has been created successfully.`
    });
    
    setNewFolderName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            {parentId 
              ? `Create a subfolder in ${getFolderPath(parentId).join(' / ')}` 
              : 'Create a new top-level folder'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Input 
            value={newFolderName} 
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            autoFocus
          />
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleAddFolder} disabled={!newFolderName.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

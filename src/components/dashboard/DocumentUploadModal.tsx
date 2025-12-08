
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { documentService, documentFolderService } from "@/services";
import { useCompany } from "@/providers/CompanyProvider";
import { useToast } from "@/components/ui/use-toast";
import { FileUploadArea } from "./upload/FileUploadArea";
import { DocumentMetadataForm } from "./upload/DocumentMetadataForm";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFolderId: string | null;
}

// Convert database folders to legacy format for compatibility
const convertToLegacyFolder = (dbFolder: any, allFolders: any[]): any => {
  const children = allFolders
    .filter(f => f.parent_id === dbFolder.id)
    .map(child => convertToLegacyFolder(child, allFolders));

  return {
    id: dbFolder.id,
    name: dbFolder.name,
    children
  };
};

export function DocumentUploadModal({ open, onOpenChange, selectedFolderId }: DocumentUploadModalProps) {
  const { currentCompany } = useCompany();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("contracts");
  const [uploading, setUploading] = useState(false);
  const [folderStructure, setFolderStructure] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Initialize selected folder from prop
  useEffect(() => {
    setSelectedFolder(selectedFolderId);
  }, [selectedFolderId, open]);
  
  // Load folder structure
  useEffect(() => {
    if (open && currentCompany?.id) {
      loadFolders();
    }
  }, [open, currentCompany?.id]);

  const loadFolders = async () => {
    if (!currentCompany?.id) return;
    
    try {
      const dbFolders = await documentFolderService.getFolders(currentCompany.id);
      const rootFolders = dbFolders.filter(f => f.parent_id === null);
      const legacyStructure = rootFolders.map(folder => convertToLegacyFolder(folder, dbFolders));
      setFolderStructure(legacyStructure);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };
  
  // Get folder name by ID
  const getFolderNameById = async (id: string | null): Promise<string> => {
    if (!id) return "All Documents";
    
    try {
      const path = await documentFolderService.getFolderPath(id);
      return path[path.length - 1] || "Unknown Folder";
    } catch (error) {
      return "Unknown Folder";
    }
  };
  
  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    // Use file name as default title if title is empty
    if (newFile && !title) {
      setTitle(newFile.name.split('.')[0]);
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };
  
  const handleFolderChange = (folderId: string) => {
    setSelectedFolder(folderId === "none" ? null : folderId);
  };
  
  const handleUpload = async () => {
    if (!file || !currentCompany?.id) return;
    
    setUploading(true);
    
    try {
      await documentService.uploadDocument(currentCompany.id, {
        title: title || file.name.split('.')[0],
        file,
        folder_id: selectedFolder
      });
      
      const folderName = await getFolderNameById(selectedFolder);
      
      toast({
        title: "Document uploaded",
        description: `${file.name} has been successfully uploaded to ${folderName}.`,
      });
      
      // Reset form and close modal
      onOpenChange(false);
      setFile(null);
      setTitle("");
      setCategory("contracts");
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document to share with your client or team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <FileUploadArea 
            file={file} 
            onFileChange={handleFileChange} 
          />
          
          <DocumentMetadataForm
            title={title}
            onTitleChange={handleTitleChange}
            selectedFolder={selectedFolder}
            folderStructure={folderStructure}
            onFolderChange={handleFolderChange}
            category={category}
            onCategoryChange={handleCategoryChange}
          />
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

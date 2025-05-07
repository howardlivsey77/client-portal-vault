
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
import { useToast } from "@/components/ui/use-toast";
import { Document } from "./DocumentGrid";
import { FolderItem } from "./FolderExplorer";
import { FileUploadArea } from "./upload/FileUploadArea";
import { DocumentMetadataForm } from "./upload/DocumentMetadataForm";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFolderId: string | null;
}

export function DocumentUploadModal({ open, onOpenChange, selectedFolderId }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("contracts");
  const [uploading, setUploading] = useState(false);
  const [folderStructure, setFolderStructure] = useState<FolderItem[]>([]);
  const { toast } = useToast();
  
  // Initialize selected folder from prop
  useEffect(() => {
    setSelectedFolder(selectedFolderId);
  }, [selectedFolderId, open]);
  
  // Load folder structure
  useEffect(() => {
    const savedFolders = localStorage.getItem('documentFolders');
    if (savedFolders) {
      try {
        setFolderStructure(JSON.parse(savedFolders));
      } catch (e) {
        console.error('Error parsing saved folders', e);
      }
    }
  }, [open]);
  
  // Get folder name by ID
  const getFolderNameById = (id: string | null): string => {
    if (!id) return "All Documents";
    
    // Recursive function to find folder by id
    const findFolder = (folders: FolderItem[], id: string): string | null => {
      for (const folder of folders) {
        if (folder.id === id) {
          return folder.name;
        }
        
        const childResult = findFolder(folder.children, id);
        if (childResult) return childResult;
      }
      
      return null;
    };
    
    for (const folder of folderStructure) {
      if (folder.id === id) return folder.name;
      
      const childName = findFolder(folder.children, id);
      if (childName) return childName;
    }
    
    return "Unknown Folder";
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
  
  const handleUpload = () => {
    if (!file) return;
    
    setUploading(true);
    
    // Simulate upload - in a real app, this would be an API call
    setTimeout(() => {
      // Generate a new document object
      const newDocument: Document = {
        id: `new-${Date.now()}`, // Generate a temporary id
        title: title || file.name.split('.')[0],
        type: file.name.split('.').pop()?.toUpperCase() || "FILE",
        updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        folderId: selectedFolder
      };
      
      // Add the document to the list if the addDocument function exists
      if (typeof window.addDocument === 'function') {
        window.addDocument(newDocument);
      }
      
      setUploading(false);
      
      toast({
        title: "Document uploaded",
        description: `${file.name} has been successfully uploaded to ${getFolderNameById(selectedFolder)}.`,
      });
      
      // Reset form and close modal
      onOpenChange(false);
      setFile(null);
      setTitle("");
      setCategory("contracts");
    }, 1500);
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

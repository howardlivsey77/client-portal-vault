
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FolderOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Document } from "./DocumentGrid";
import { FolderItem } from "./FolderExplorer";

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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Use file name as default title if title is empty
      if (!title) {
        setTitle(e.target.files[0].name.split('.')[0]);
      }
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
  
  // Recursively render folder options
  const renderFolderOptions = (folders: FolderItem[], level = 0) => {
    const options: JSX.Element[] = [];
    
    folders.forEach(folder => {
      options.push(
        <SelectItem key={folder.id} value={folder.id}>
          {"\u00A0".repeat(level * 2) + folder.name}
        </SelectItem>
      );
      
      if (folder.children.length > 0) {
        options.push(...renderFolderOptions(folder.children, level + 1));
      }
    });
    
    return options;
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
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 p-10 rounded-md">
            {file ? (
              <div className="text-center">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <Button 
                  variant="secondary" 
                  className="mt-2" 
                  onClick={() => setFile(null)}
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="mb-4 h-10 w-10 text-muted-foreground/70" />
                <label
                  htmlFor="document-upload"
                  className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Choose File
                </label>
                <input
                  id="document-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Max file size: 25MB
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="document-title">Title</Label>
            <Input 
              id="document-title" 
              placeholder="Enter document title" 
              value={title}
              onChange={handleTitleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <Select 
              value={selectedFolder || "none"} 
              onValueChange={handleFolderChange}
            >
              <SelectTrigger id="folder" className="w-full">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    All Documents
                  </div>
                </SelectItem>
                {renderFolderOptions(folderStructure)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contracts">Contracts</SelectItem>
                <SelectItem value="reports">Reports</SelectItem>
                <SelectItem value="invoices">Invoices</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

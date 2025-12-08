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
import { FolderUploadArea } from "./upload/FolderUploadArea";
import { FileWithPath, FolderUploadProgress } from "@/types/documents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploadArea } from "./upload/FileUploadArea";
import { DocumentMetadataForm } from "./upload/DocumentMetadataForm";

interface FolderUploadModalProps {
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

export function FolderUploadModal({ open, onOpenChange, selectedFolderId }: FolderUploadModalProps) {
  const { currentCompany } = useCompany();
  const { toast } = useToast();
  
  // Single file upload state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("contracts");
  
  // Folder upload state
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<FolderUploadProgress | undefined>();
  const [folderStructure, setFolderStructure] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"file" | "folder">("file");
  
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

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setFiles([]);
      setTitle("");
      setCategory("contracts");
      setUploading(false);
      setProgress(undefined);
      setActiveTab("file");
    }
  }, [open]);

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
  
  const handleSingleFileUpload = async () => {
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
      
      onOpenChange(false);
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

  const handleFolderUpload = async () => {
    if (!files.length || !currentCompany?.id) return;
    
    setUploading(true);
    
    try {
      await documentService.uploadFolderStructure(
        currentCompany.id,
        files,
        setProgress
      );
      
      toast({
        title: "Folder uploaded",
        description: `Successfully uploaded ${files.length} files with folder structure.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading folder:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload folder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const canUpload = activeTab === "file" ? !!file : files.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload individual files or entire folder structures.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "file" | "folder")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Single File</TabsTrigger>
            <TabsTrigger value="folder">Folder Structure</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4 mt-4">
            <FileUploadArea 
              file={file} 
              onFileChange={handleFileChange}
              disabled={uploading}
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
          </TabsContent>
          
          <TabsContent value="folder" className="space-y-4 mt-4">
            <FolderUploadArea
              files={files}
              onFilesChange={setFiles}
              progress={progress}
              disabled={uploading}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={uploading}>Cancel</Button>
          </DialogClose>
          <Button 
            onClick={activeTab === "file" ? handleSingleFileUpload : handleFolderUpload}
            disabled={!canUpload || uploading}
          >
            {uploading ? "Uploading..." : `Upload ${activeTab === "file" ? "File" : "Folder"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
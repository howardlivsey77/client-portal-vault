
import { useState } from "react";
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
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Document } from "./DocumentGrid";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentUploadModal({ open, onOpenChange }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("contracts");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
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
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      };
      
      // Add the document to the list if the addDocument function exists
      if (typeof window.addDocument === 'function') {
        window.addDocument(newDocument);
      }
      
      setUploading(false);
      
      toast({
        title: "Document uploaded",
        description: `${file.name} has been successfully uploaded.`,
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

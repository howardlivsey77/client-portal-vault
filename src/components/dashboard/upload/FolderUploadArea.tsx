import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FolderOpen, X, AlertCircle } from "lucide-react";
import { FileWithPath, FolderUploadProgress } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FolderUploadAreaProps {
  files: FileWithPath[];
  onFilesChange: (files: FileWithPath[]) => void;
  progress?: FolderUploadProgress;
  disabled?: boolean;
}

export function FolderUploadArea({ 
  files, 
  onFilesChange, 
  progress, 
  disabled 
}: FolderUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const filesWithPath: FileWithPath[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      // Get relative path from webkitRelativePath
      const relativePath = (file as any).webkitRelativePath || file.name;
      filesWithPath.push({ file, path: relativePath });
    }
    
    onFilesChange(filesWithPath);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const items = e.dataTransfer.items;
    const filesWithPath: FileWithPath[] = [];

    const processEntry = async (entry: any, path = '') => {
      if (entry.isFile) {
        entry.file((file: File) => {
          filesWithPath.push({ file, path: path + file.name });
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        dirReader.readEntries((entries: any[]) => {
          entries.forEach(childEntry => {
            processEntry(childEntry, path + entry.name + '/');
          });
        });
      }
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          processEntry(entry);
        }
      }
    }

    // Wait a bit for async file processing
    setTimeout(() => {
      onFilesChange(filesWithPath);
    }, 100);
  };

  const triggerFolderSelect = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const clearFiles = () => {
    onFilesChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFolderStructure = () => {
    const folders = new Set<string>();
    files.forEach(f => {
      const parts = f.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join('/'));
      }
    });
    return Array.from(folders).sort();
  };

  if (files.length > 0) {
    const folderStructure = getFolderStructure();
    const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 p-4 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {files.length} files selected ({totalSizeMB} MB)
              </span>
            </div>
            {!disabled && (
              <Button variant="ghost" size="sm" onClick={clearFiles}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {progress && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Uploading: {progress.currentFile}</span>
                <span>{progress.completed} / {progress.total}</span>
              </div>
              <Progress 
                value={(progress.completed / progress.total) * 100} 
                className="w-full"
              />
              {progress.failed > 0 && (
                <div className="text-sm text-destructive">
                  {progress.failed} files failed to upload
                </div>
              )}
            </div>
          )}

          <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground">
            <div className="font-medium mb-1">Folder structure:</div>
            {folderStructure.map(folder => (
              <div key={folder} className="pl-2">📁 {folder}</div>
            ))}
          </div>
        </div>

        {progress?.errors && progress.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some files failed to upload:
              <ul className="list-disc list-inside mt-1">
                {progress.errors.slice(0, 3).map((error, index) => (
                  <li key={index} className="text-xs">
                    {error.file.file.name}: {error.error}
                  </li>
                ))}
                {progress.errors.length > 3 && (
                  <li className="text-xs">...and {progress.errors.length - 3} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-dashed p-10 rounded-md cursor-pointer transition-colors ${
        isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFolderSelect}
    >
      <FolderOpen className="mb-4 h-10 w-10 text-muted-foreground/70" />
      <div className="text-center">
        <p className="font-medium mb-2">
          Drop folders here or click to select
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Upload entire folder structures with all files preserved
        </p>
        <Button variant="outline" size="sm" disabled={disabled}>
          Choose Folders
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "true" } as any)}
        className="sr-only"
        onChange={handleFolderSelect}
        disabled={disabled}
      />
    </div>
  );
}
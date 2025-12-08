
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "@/hooks";

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
  acceptedFileTypes: string;
  uploadedFile: File | null;
  description: string;
}

export function FileUploader({
  onFileChange,
  acceptedFileTypes,
  uploadedFile,
  description,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = acceptedFileTypes
      .split(',')
      .map(type => type.trim().replace('.', '').toLowerCase());
    
    if (fileExtension && acceptedTypes.includes(fileExtension)) {
      onFileChange(file);
    } else {
      toast({
        title: "Invalid file type",
        description: `Please upload a file with one of these extensions: ${acceptedFileTypes}`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div
        className={`w-full p-6 rounded-md border-2 border-dashed ${
          isDragging ? "border-monday-blue bg-monday-blue/5" : "border-gray-300"
        } transition-colors duration-200 flex flex-col items-center justify-center cursor-pointer`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!uploadedFile ? triggerFileInput : undefined}
      >
        {uploadedFile ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center justify-between w-full max-w-xs">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-monday-blue" />
                <div>
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Upload className="h-10 w-10 text-monday-blue" />
            <div className="flex flex-col items-center space-y-1">
              <p className="text-sm font-medium">Click or drag file to upload</p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                {description}
              </p>
              <p className="text-xs text-muted-foreground">
                Allowed file types: {acceptedFileTypes}
              </p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={acceptedFileTypes}
      />
    </div>
  );
}

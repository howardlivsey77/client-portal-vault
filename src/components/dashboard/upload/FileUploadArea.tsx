
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileUploadAreaProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function FileUploadArea({ file, onFileChange, disabled }: FileUploadAreaProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };
  
  return (
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
            onClick={() => onFileChange(null)}
            disabled={disabled}
          >
            Choose Different File
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="mb-4 h-10 w-10 text-muted-foreground/70" />
          <label
            htmlFor="document-upload"
            className={`rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/90'
            }`}
          >
            Choose File
          </label>
          <input
            id="document-upload"
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            disabled={disabled}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Max file size: 25MB
          </p>
        </div>
      )}
    </div>
  );
}

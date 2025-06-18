
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, FolderPlus } from "lucide-react";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { DocumentGridHeaderProps } from "./types";

export function DocumentGridHeader({
  selectedFolderId,
  onNavigateBack,
  folderPath = [],
  onAddDocument,
  onAddFolder
}: DocumentGridHeaderProps) {
  if (!selectedFolderId) return null;
  
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        {onNavigateBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onNavigateBack} 
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => onNavigateBack && onNavigateBack()}>
                Documents
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {folderPath.map((folder, index) => (
              <React.Fragment key={index}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="font-medium">{folder}</span>
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex items-center gap-2">
        {onAddFolder && (
          <Button variant="outline" onClick={onAddFolder} size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Subfolder
          </Button>
        )}
        <Button onClick={onAddDocument} size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>
    </div>
  );
}

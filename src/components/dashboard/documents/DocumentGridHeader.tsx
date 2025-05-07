
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
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
  onAddDocument
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
      
      <Button variant="outline" onClick={onAddDocument} size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Add Document
      </Button>
    </div>
  );
}

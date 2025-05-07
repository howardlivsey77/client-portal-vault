import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, FolderOpen, Folder } from "lucide-react";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { findFolderById, loadFolderStructure } from "./folder/folderService";
import { FolderTile } from "./folder/FolderItem";

export interface Document {
  id: string;
  title: string;
  type: string;
  updatedAt: string;
  size: string;
  folderId: string | null;
}

interface DocumentGridProps {
  onAddDocument: () => void;
  selectedFolderId: string | null;
  onNavigateBack?: () => void;
  folderPath?: string[];
  onFolderSelect?: (folderId: string) => void;
}

export function DocumentGrid({
  onAddDocument,
  selectedFolderId,
  onNavigateBack,
  folderPath = [],
  onFolderSelect
}: DocumentGridProps) {
  // Initial documents list
  const initialDocuments = [
    {
      id: "1",
      title: "Contract Agreement - Q2 2023",
      type: "PDF",
      updatedAt: "May 1, 2023",
      size: "2.4 MB",
      folderId: "contracts"
    }, {
      id: "2",
      title: "Financial Report",
      type: "XLSX",
      updatedAt: "Apr 15, 2023",
      size: "1.8 MB",
      folderId: "reports"
    }, {
      id: "3",
      title: "Project Proposal",
      type: "DOCX",
      updatedAt: "Apr 10, 2023",
      size: "3.2 MB",
      folderId: null
    }, {
      id: "4",
      title: "Meeting Notes - Strategy Session",
      type: "PDF",
      updatedAt: "Mar 28, 2023",
      size: "1.1 MB",
      folderId: null
    }, {
      id: "5",
      title: "Client Onboarding Guide",
      type: "PDF",
      updatedAt: "Mar 22, 2023",
      size: "4.5 MB",
      folderId: null
    }, {
      id: "6",
      title: "Marketing Assets",
      type: "ZIP",
      updatedAt: "Mar 15, 2023",
      size: "12.8 MB",
      folderId: null
    }, {
      id: "7",
      title: "Product Roadmap",
      type: "PPTX",
      updatedAt: "Mar 10, 2023",
      size: "5.7 MB",
      folderId: null
    }
  ];
  
  const [documents, setDocuments] = useState<Document[]>(() => {
    // Try to load documents from localStorage
    const savedDocs = localStorage.getItem('documents');
    if (savedDocs) {
      try {
        return JSON.parse(savedDocs);
      } catch (e) {
        console.error('Error parsing saved documents', e);
        return initialDocuments;
      }
    }
    return initialDocuments;
  });

  // Get subfolders for the current folder
  const [subfolders, setSubfolders] = useState<any[]>([]);

  // Load subfolders when the selected folder changes
  useEffect(() => {
    if (selectedFolderId) {
      const folderStructure = loadFolderStructure();
      const currentFolder = findFolderById(folderStructure, selectedFolderId);
      if (currentFolder && currentFolder.children) {
        setSubfolders(currentFolder.children);
      } else {
        setSubfolders([]);
      }
    } else {
      setSubfolders([]);
    }
  }, [selectedFolderId]);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  // Filter documents based on selected folder
  const filteredDocuments = selectedFolderId ? documents.filter(doc => doc.folderId === selectedFolderId) : documents;

  // Method to add a new document to the list
  const addDocument = (newDoc: Document) => {
    setDocuments(prevDocs => [{
      ...newDoc,
      folderId: selectedFolderId
    }, ...prevDocs]);
  };

  // Method to move a document to a different folder
  const moveDocument = (docId: string, targetFolderId: string | null) => {
    setDocuments(prevDocs => prevDocs.map(doc => doc.id === docId ? {
      ...doc,
      folderId: targetFolderId
    } : doc));
  };

  // Add the methods to window for access from other components
  window.addDocument = addDocument;
  window.moveDocument = moveDocument;

  const handleFolderSelect = (folderId: string) => {
    if (onFolderSelect) {
      onFolderSelect(folderId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation and back button */}
      {selectedFolderId && (
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
      )}
      
      {/* Subfolders section */}
      {selectedFolderId && subfolders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Folders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {subfolders.map(folder => (
              <FolderTile
                key={folder.id}
                folder={folder}
                isSelected={false}
                onFolderSelect={handleFolderSelect}
                onEditFolder={() => {}}
                onAddSubfolder={() => {}}
                onDeleteFolder={() => {}}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Document list */}
      {selectedFolderId && (
        <>
          <h3 className="text-lg font-medium mb-3">Documents</h3>
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-md mr-3 ${
                      doc.type === 'PDF' ? 'bg-red-100' : 
                      doc.type === 'DOCX' ? 'bg-blue-100' : 
                      doc.type === 'XLSX' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <FileText className={`h-6 w-6 ${
                        doc.type === 'PDF' ? 'text-red-500' : 
                        doc.type === 'DOCX' ? 'text-blue-500' : 
                        doc.type === 'XLSX' ? 'text-green-500' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{doc.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        {doc.type} • {doc.size} • Updated {doc.updatedAt}
                      </div>
                    </div>
                  </div>
                  <div>
                    {/* Document actions could go here */}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No documents in this folder</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a document to get started.
              </p>
              <Button onClick={onAddDocument}>
                <FileText className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          )}
        </>
      )}
      
      {!selectedFolderId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* This area would show root level documents */}
          <p className="col-span-full text-muted-foreground">
            Select a folder to view its contents
          </p>
        </div>
      )}
    </div>
  );
}

// Extend Window interface to include our functions
declare global {
  interface Window {
    addDocument: (doc: Document) => void;
    moveDocument: (docId: string, targetFolderId: string | null) => void;
  }
}

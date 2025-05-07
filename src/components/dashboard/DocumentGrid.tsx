
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { FileText, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

export function DocumentGrid({
  onAddDocument,
  selectedFolderId
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

  // Function to render document type icon
  const getDocumentIcon = (type: string) => {
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  return (
    <div>
      {selectedFolderId ? (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Folder Contents</h2>
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="p-6 flex flex-col hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-center mb-4">
                    {getDocumentIcon(doc.type)}
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">{doc.title}</h3>
                  <div className="mt-auto text-sm text-muted-foreground text-center">
                    <p>{doc.type} • {doc.size}</p>
                    <p>Updated: {doc.updatedAt}</p>
                  </div>
                </Card>
              ))}
              <Card 
                className="p-6 flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={onAddDocument}
              >
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center font-medium">Add New Document</p>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-medium mb-2">This folder is empty</p>
              <p className="text-muted-foreground mb-6">Upload documents or create new ones to populate this folder.</p>
              <Button onClick={onAddDocument}>
                <FileText className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {documents.filter(doc => !doc.folderId).map((doc) => (
            <Card key={doc.id} className="p-6 flex flex-col hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-center mb-4">
                {getDocumentIcon(doc.type)}
              </div>
              <h3 className="text-lg font-medium text-center mb-2">{doc.title}</h3>
              <div className="mt-auto text-sm text-muted-foreground text-center">
                <p>{doc.type} • {doc.size}</p>
                <p>Updated: {doc.updatedAt}</p>
              </div>
            </Card>
          ))}
          <Card 
            className="p-6 flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={onAddDocument}
          >
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center font-medium">Add New Document</p>
          </Card>
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

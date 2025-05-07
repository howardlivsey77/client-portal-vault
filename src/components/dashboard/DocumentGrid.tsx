import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Documents</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Default folder cards removed */}
      </div>
      
      {selectedFolderId && (
        <div className="mt-8">
          <h3 className="text-xl font-medium mb-4">Folder Contents</h3>
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {/* Document list content would go here */}
              <p>This folder contains {filteredDocuments.length} documents</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">This folder is empty</p>
            </div>
          )}
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

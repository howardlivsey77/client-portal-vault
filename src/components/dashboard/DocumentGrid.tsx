
import { useState } from "react";
import { DocumentCard } from "./DocumentCard";
import { AddDocumentButton } from "./AddDocumentButton";

export interface Document {
  id: string;
  title: string;
  type: string;
  updatedAt: string;
  size: string;
}

interface DocumentGridProps {
  onAddDocument: () => void;
}

export function DocumentGrid({ onAddDocument }: DocumentGridProps) {
  // Initial documents list
  const initialDocuments = [
    {
      id: "1",
      title: "Contract Agreement - Q2 2023",
      type: "PDF",
      updatedAt: "May 1, 2023",
      size: "2.4 MB"
    },
    {
      id: "2",
      title: "Financial Report",
      type: "XLSX",
      updatedAt: "Apr 15, 2023",
      size: "1.8 MB"
    },
    {
      id: "3",
      title: "Project Proposal",
      type: "DOCX",
      updatedAt: "Apr 10, 2023",
      size: "3.2 MB"
    },
    {
      id: "4",
      title: "Meeting Notes - Strategy Session",
      type: "PDF",
      updatedAt: "Mar 28, 2023",
      size: "1.1 MB"
    },
    {
      id: "5",
      title: "Client Onboarding Guide",
      type: "PDF",
      updatedAt: "Mar 22, 2023", 
      size: "4.5 MB"
    },
    {
      id: "6",
      title: "Marketing Assets",
      type: "ZIP",
      updatedAt: "Mar 15, 2023",
      size: "12.8 MB"
    },
    {
      id: "7",
      title: "Product Roadmap",
      type: "PPTX",
      updatedAt: "Mar 10, 2023",
      size: "5.7 MB"
    }
  ];
  
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  
  // Method to add a new document to the list
  const addDocument = (newDoc: Document) => {
    setDocuments(prevDocs => [newDoc, ...prevDocs]);
  };
  
  // Add the addDocument method to window for access from other components
  // This is a simple approach for component communication without prop drilling or context
  window.addDocument = addDocument;
  
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AddDocumentButton onClick={onAddDocument} />
      
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          title={doc.title}
          type={doc.type}
          updatedAt={doc.updatedAt}
          size={doc.size}
        />
      ))}
    </div>
  );
}

// Extend Window interface to include our addDocument function
declare global {
  interface Window {
    addDocument: (doc: Document) => void;
  }
}

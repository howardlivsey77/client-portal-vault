
import { DocumentCard } from "./DocumentCard";
import { AddDocumentButton } from "./AddDocumentButton";

interface DocumentGridProps {
  onAddDocument: () => void;
}

export function DocumentGrid({ onAddDocument }: DocumentGridProps) {
  // This would typically come from your backend
  const documents = [
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

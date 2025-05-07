
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { DocumentListProps } from "./types";

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) return null;
  
  return (
    <div className="grid grid-cols-1 gap-4">
      {documents.map((doc) => (
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
  );
}

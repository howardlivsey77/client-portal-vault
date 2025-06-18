
import { FileText } from "lucide-react";

export const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return <FileText className="h-8 w-8 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-8 w-8 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileText className="h-8 w-8 text-green-500" />;
    default:
      return <FileText className="h-8 w-8 text-gray-500" />;
  }
};

export const moveToFolder = (documentId: string, targetFolderId: string | null) => {
  if (typeof window.moveDocument === 'function') {
    window.moveDocument(documentId, targetFolderId);
  }
};

export const renameDocument = (documentId: string, newTitle: string) => {
  if (typeof window.renameDocument === 'function') {
    window.renameDocument(documentId, newTitle);
  }
};

export const deleteDocument = (documentId: string) => {
  if (typeof window.deleteDocument === 'function') {
    window.deleteDocument(documentId);
  }
};

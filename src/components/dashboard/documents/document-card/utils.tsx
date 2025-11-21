
import { FileText } from "lucide-react";
import { documentService } from "@/services/documentService";
import { toast } from "sonner";

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

export const viewDocument = async (filePath: string, title: string) => {
  try {
    const url = await documentService.getDownloadUrl(filePath);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Failed to view document:', error);
    toast.error("Failed to open document");
  }
};

export const downloadDocument = async (filePath: string, title: string) => {
  try {
    const url = await documentService.getDownloadUrl(filePath);
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download document:', error);
    toast.error("Failed to download document");
  }
};

import { FileText } from "lucide-react";
import { documentService } from "@/services";
import { toast } from "sonner";

export const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return <FileText className="h-8 w-8 text-destructive" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-8 w-8 text-primary" />;
    case 'xls':
    case 'xlsx':
      return <FileText className="h-8 w-8 text-secondary" />;
    default:
      return <FileText className="h-8 w-8 text-muted-foreground" />;
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
  // Open a blank window immediately to preserve the user gesture
  const newWindow = window.open("", "_blank");

  // If the browser blocked the popup, newWindow will be null
  if (!newWindow) {
    toast.error("Unable to open document. Please allow pop-ups for this site and try again.");
    return;
  }

  try {
    const url = await documentService.getDownloadUrl(filePath);
    
    // Once we have the signed URL, navigate the already-open window
    newWindow.location.href = url;
  } catch (error) {
    console.error("Failed to view document:", error);
    
    // Close the placeholder window if we failed to load the document
    newWindow.close();
    toast.error("Failed to open document. Please try again.");
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

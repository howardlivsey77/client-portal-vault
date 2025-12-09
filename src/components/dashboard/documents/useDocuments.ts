
import { useState, useEffect } from "react";
import { DatabaseDocument } from "@/types";
import { documentService } from "@/services";
import { useCompany } from "@/providers";
import { toast } from "@/hooks";

export function useDocuments(selectedFolderId: string | null) {
  const { currentCompany } = useCompany();
  const [documents, setDocuments] = useState<DatabaseDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Load documents when company or folder changes
  useEffect(() => {
    loadDocuments();
  }, [currentCompany?.id, selectedFolderId]);

  const loadDocuments = async () => {
    if (!currentCompany?.id) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const docs = await documentService.getDocuments(currentCompany.id, selectedFolderId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error loading documents",
        description: "Failed to load documents",
        variant: "destructive"
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Method to add a new document
  const addDocument = async (uploadData: { title: string; file: File; folder_id?: string | null }) => {
    if (!currentCompany?.id) return;

    try {
      await documentService.uploadDocument(currentCompany.id, {
        title: uploadData.title,
        file: uploadData.file,
        folder_id: uploadData.folder_id || selectedFolderId
      });
      await loadDocuments();
      toast({
        title: "Document uploaded",
        description: `${uploadData.file.name} has been successfully uploaded.`,
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document",
        variant: "destructive"
      });
    }
  };

  // Method to move a document to a different folder
  const moveDocument = async (docId: string, targetFolderId: string | null) => {
    try {
      await documentService.updateDocument(docId, { folder_id: targetFolderId });
      await loadDocuments();
      toast({
        title: "Document moved",
        description: "Document has been moved successfully.",
      });
    } catch (error) {
      console.error('Error moving document:', error);
      toast({
        title: "Move failed",
        description: "Failed to move document",
        variant: "destructive"
      });
    }
  };

  // Method to delete a document
  const deleteDocument = async (docId: string) => {
    try {
      await documentService.deleteDocument(docId);
      await loadDocuments();
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  // Method to rename a document
  const renameDocument = async (docId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      toast({
        title: "Invalid name",
        description: "Document name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      await documentService.updateDocument(docId, { title: newTitle });
      await loadDocuments();
      toast({
        title: "Document renamed",
        description: "The document has been successfully renamed.",
      });
    } catch (error) {
      console.error('Error renaming document:', error);
      toast({
        title: "Rename failed",
        description: "Failed to rename document",
        variant: "destructive"
      });
    }
  };

  return {
    documents,
    loading,
    addDocument,
    moveDocument,
    deleteDocument,
    renameDocument
  };
}

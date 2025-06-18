
import { supabase } from "@/integrations/supabase/client";
import { DatabaseDocument, DocumentUploadData } from "@/types/documents";

export const documentService = {
  // Get documents for a company and optional folder
  async getDocuments(companyId: string, folderId: string | null = null): Promise<DatabaseDocument[]> {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId);
    
    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Upload a document
  async uploadDocument(companyId: string, uploadData: DocumentUploadData): Promise<DatabaseDocument> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Generate unique file path
    const fileExtension = uploadData.file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `${companyId}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(filePath, uploadData.file);

    if (uploadError) throw uploadError;

    // Create document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        company_id: companyId,
        folder_id: uploadData.folder_id,
        title: uploadData.title,
        file_name: uploadData.file.name,
        file_path: filePath,
        file_size: uploadData.file.size,
        mime_type: uploadData.file.type,
        uploaded_by: user.data.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update document
  async updateDocument(documentId: string, updates: Partial<Pick<DatabaseDocument, 'title' | 'folder_id'>>): Promise<DatabaseDocument> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete document
  async deleteDocument(documentId: string): Promise<void> {
    // First get the document to get the file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('client-documents')
      .remove([document.file_path]);

    if (storageError) console.warn('Failed to delete file from storage:', storageError);

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  // Get download URL for a document
  async getDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('client-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  }
};

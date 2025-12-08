import { supabase } from "@/integrations/supabase/client";
import { DatabaseDocument, DocumentUploadData, FileWithPath, FolderUploadProgress } from "@/types";

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
  },

  // Upload multiple documents with folder structure
  async uploadFolderStructure(
    companyId: string, 
    files: FileWithPath[], 
    onProgress?: (progress: FolderUploadProgress) => void
  ): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Create folder structure first
    const folderMap = new Map<string, string>(); // path -> folder_id
    const folderPaths = [...new Set(files.map(f => f.path.split('/').slice(0, -1).join('/')).filter(Boolean))];
    
    // Sort folders by depth to create parent folders first
    folderPaths.sort((a, b) => a.split('/').length - b.split('/').length);
    
    for (const folderPath of folderPaths) {
      const pathParts = folderPath.split('/');
      const folderName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join('/');
      const parentId = parentPath ? folderMap.get(parentPath) : null;
      
      // Check if folder already exists
      const existingFolder = await this.findFolderByNameAndParent(companyId, folderName, parentId);
      
      if (existingFolder) {
        folderMap.set(folderPath, existingFolder.id);
      } else {
        // Create new folder
        const { data: folder, error } = await supabase
          .from('document_folders')
          .insert({
            company_id: companyId,
            name: folderName,
            parent_id: parentId,
            created_by: user.data.user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        folderMap.set(folderPath, folder.id);
      }
    }

    // Upload files
    let completed = 0;
    const total = files.length;
    const failed: Array<{ file: FileWithPath; error: string }> = [];

    for (const fileWithPath of files) {
      try {
        const folderPath = fileWithPath.path.split('/').slice(0, -1).join('/');
        const folderId = folderPath ? folderMap.get(folderPath) : null;
        
        // Generate unique file path
        const fileExtension = fileWithPath.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `${companyId}/${fileName}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(filePath, fileWithPath.file);

        if (uploadError) throw uploadError;

        // Create document record
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            company_id: companyId,
            folder_id: folderId,
            title: fileWithPath.file.name.split('.')[0],
            file_name: fileWithPath.file.name,
            file_path: filePath,
            file_size: fileWithPath.file.size,
            mime_type: fileWithPath.file.type,
            uploaded_by: user.data.user.id
          });

        if (dbError) throw dbError;

        completed++;
        onProgress?.({
          completed,
          total,
          failed: failed.length,
          currentFile: fileWithPath.file.name,
          phase: completed === total ? 'complete' : 'uploading'
        });
      } catch (error) {
        failed.push({ 
          file: fileWithPath, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        onProgress?.({
          completed,
          total,
          failed: failed.length,
          currentFile: fileWithPath.file.name,
          phase: 'uploading',
          errors: failed
        });
      }
    }
  },

  // Helper method to find folder by name and parent
  async findFolderByNameAndParent(companyId: string, name: string, parentId: string | null) {
    let query = supabase
      .from('document_folders')
      .select('*')
      .eq('company_id', companyId)
      .eq('name', name);
    
    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }
    
    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }
};

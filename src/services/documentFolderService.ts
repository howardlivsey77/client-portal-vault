
import { supabase } from "@/integrations/supabase/client";
import { DatabaseFolder } from "@/types/documents";

export const documentFolderService = {
  // Get all folders for a company
  async getFolders(companyId: string): Promise<DatabaseFolder[]> {
    const { data, error } = await supabase
      .from('document_folders')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Create a new folder
  async createFolder(companyId: string, name: string, parentId: string | null = null): Promise<DatabaseFolder> {
    const { data, error } = await supabase
      .from('document_folders')
      .insert({
        company_id: companyId,
        name: name.trim(),
        parent_id: parentId,
        created_by: (await supabase.auth.getUser()).data.user?.id || ''
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update folder name
  async updateFolder(folderId: string, name: string): Promise<DatabaseFolder> {
    const { data, error } = await supabase
      .from('document_folders')
      .update({ name: name.trim() })
      .eq('id', folderId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete folder and all its contents
  async deleteFolder(folderId: string): Promise<void> {
    const { error } = await supabase
      .from('document_folders')
      .delete()
      .eq('id', folderId);
    
    if (error) throw error;
  },

  // Get folder path (breadcrumb)
  async getFolderPath(folderId: string | null): Promise<string[]> {
    if (!folderId) return ["All Documents"];
    
    const path: string[] = [];
    let currentId = folderId;
    
    while (currentId) {
      const { data, error } = await supabase
        .from('document_folders')
        .select('name, parent_id')
        .eq('id', currentId)
        .single();
      
      if (error || !data) break;
      
      path.unshift(data.name);
      currentId = data.parent_id;
    }
    
    return path.length > 0 ? path : ["Unknown Folder"];
  }
};

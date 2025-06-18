
export interface DatabaseFolder {
  id: string;
  company_id: string;
  name: string;
  parent_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDocument {
  id: string;
  company_id: string;
  folder_id: string | null;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentUploadData {
  title: string;
  file: File;
  folder_id?: string | null;
}

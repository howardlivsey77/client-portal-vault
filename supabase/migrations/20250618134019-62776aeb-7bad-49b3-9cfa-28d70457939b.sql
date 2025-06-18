
-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents', 
  'client-documents', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'image/jpeg', 'image/png', 'image/gif']
);

-- Create document_folders table
CREATE TABLE public.document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.document_folders(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT folder_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT document_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT document_file_name_not_empty CHECK (length(trim(file_name)) > 0),
  CONSTRAINT document_file_path_not_empty CHECK (length(trim(file_path)) > 0),
  CONSTRAINT document_file_size_positive CHECK (file_size > 0)
);

-- Add indexes for better performance
CREATE INDEX idx_document_folders_company_id ON public.document_folders(company_id);
CREATE INDEX idx_document_folders_parent_id ON public.document_folders(parent_id);
CREATE INDEX idx_documents_company_id ON public.documents(company_id);
CREATE INDEX idx_documents_folder_id ON public.documents(folder_id);

-- Enable RLS on both tables
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_folders
CREATE POLICY "Users can view folders for their companies" ON public.document_folders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_access ca 
      WHERE ca.user_id = auth.uid() AND ca.company_id = document_folders.company_id
    )
  );

CREATE POLICY "Users can create folders for their companies" ON public.document_folders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_access ca 
      WHERE ca.user_id = auth.uid() AND ca.company_id = document_folders.company_id
    )
  );

CREATE POLICY "Users can update folders for their companies" ON public.document_folders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.company_access ca 
      WHERE ca.user_id = auth.uid() AND ca.company_id = document_folders.company_id
    )
  );

CREATE POLICY "Users can delete folders for their companies" ON public.document_folders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.company_access ca 
      WHERE ca.user_id = auth.uid() AND ca.company_id = document_folders.company_id
    )
  );

-- RLS policies for documents
CREATE POLICY "Users can view documents for their companies" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_access ca 
      WHERE ca.user_id = auth.uid() AND ca.company_id = documents.company_id
    )
  );

CREATE POLICY "Users can create documents for their companies" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_access ca 
      WHERE ca.user_id = auth.uid() AND ca.company_id = documents.company_id
    )
  );

CREATE POLICY "Users can update documents for their companies" ON public.documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.company_access ca 
      WHERE ca.user_id = auth.uid() AND ca.company_id = documents.company_id
    )
  );

CREATE POLICY "Users can delete documents for their companies" ON public.documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.company_access ca 
      WHERE ca.user_id = auth.uid() AND ca.company_id = documents.company_id
    )
  );

-- Storage policies for client-documents bucket
CREATE POLICY "Users can view files for their companies" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-documents' AND 
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.company_access ca ON d.company_id = ca.company_id
      WHERE d.file_path = storage.objects.name 
      AND ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files for their companies" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update files for their companies" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'client-documents' AND 
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.company_access ca ON d.company_id = ca.company_id
      WHERE d.file_path = storage.objects.name 
      AND ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files for their companies" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'client-documents' AND 
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.company_access ca ON d.company_id = ca.company_id
      WHERE d.file_path = storage.objects.name 
      AND ca.user_id = auth.uid()
    )
  );

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_folders_updated_at BEFORE UPDATE ON public.document_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

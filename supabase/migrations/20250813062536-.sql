-- Add logo_url column to companies table
ALTER TABLE public.companies 
ADD COLUMN logo_url TEXT;

-- Create company-logos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);

-- Create RLS policies for company logos storage
CREATE POLICY "Users can view company logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');

CREATE POLICY "Company admins can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
  AND (
    is_admin(auth.uid()) 
    OR user_has_company_access(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin')
  )
);

CREATE POLICY "Company admins can update logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
  AND (
    is_admin(auth.uid()) 
    OR user_has_company_access(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin')
  )
);

CREATE POLICY "Company admins can delete logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
  AND (
    is_admin(auth.uid()) 
    OR user_has_company_access(auth.uid(), (storage.foldername(name))[1]::uuid, 'admin')
  )
);
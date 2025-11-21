-- Update documents table RLS policies to support admin and regular users
DROP POLICY IF EXISTS "Users can view documents for their companies" ON documents;
DROP POLICY IF EXISTS "Users can create documents for their companies" ON documents;
DROP POLICY IF EXISTS "Users can update documents for their companies" ON documents;
DROP POLICY IF EXISTS "Users can delete documents for their companies" ON documents;

CREATE POLICY "Users can view documents for their companies"
ON documents FOR SELECT
USING (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can create documents for their companies"
ON documents FOR INSERT
WITH CHECK (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can update documents for their companies"
ON documents FOR UPDATE
USING (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can delete documents for their companies"
ON documents FOR DELETE
USING (user_has_company_access(auth.uid(), company_id));

-- Update document_folders table RLS policies to support admin and regular users
DROP POLICY IF EXISTS "Users can view folders for their companies" ON document_folders;
DROP POLICY IF EXISTS "Users can create folders for their companies" ON document_folders;
DROP POLICY IF EXISTS "Users can update folders for their companies" ON document_folders;
DROP POLICY IF EXISTS "Users can delete folders for their companies" ON document_folders;

CREATE POLICY "Users can view folders for their companies"
ON document_folders FOR SELECT
USING (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can create folders for their companies"
ON document_folders FOR INSERT
WITH CHECK (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can update folders for their companies"
ON document_folders FOR UPDATE
USING (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Users can delete folders for their companies"
ON document_folders FOR DELETE
USING (user_has_company_access(auth.uid(), company_id));
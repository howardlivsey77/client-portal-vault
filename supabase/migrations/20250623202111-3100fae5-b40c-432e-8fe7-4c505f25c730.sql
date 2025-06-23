
-- Create departments table with company association
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, name)
);

-- Add RLS policies
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Policy for viewing departments - users can see departments for companies they have access to
CREATE POLICY "Users can view company departments" ON public.departments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_access ca 
      WHERE ca.company_id = departments.company_id 
      AND ca.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- Policy for creating departments - admin users only
CREATE POLICY "Admins can create departments" ON public.departments
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Policy for updating departments - admin users only
CREATE POLICY "Admins can update departments" ON public.departments
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Policy for deleting departments - admin users only
CREATE POLICY "Admins can delete departments" ON public.departments
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_departments_company_id ON public.departments(company_id);
CREATE INDEX idx_departments_active ON public.departments(company_id, is_active) WHERE is_active = true;

-- Insert departments for The Swan Practice (assuming company_id exists)
-- First, let's get The Swan Practice company ID and insert departments
WITH company_info AS (
  SELECT id FROM public.companies WHERE name = 'The Swan Practice' LIMIT 1
)
INSERT INTO public.departments (company_id, name, created_by)
SELECT 
  ci.id,
  dept_name,
  auth.uid()
FROM company_info ci,
(VALUES 
  ('Engineering'),
  ('Sales'),
  ('Marketing'),
  ('Human Resources'),
  ('Finance'),
  ('Operations'),
  ('Customer Support'),
  ('Research & Development'),
  ('Legal'),
  ('Executive'),
  ('GP'),
  ('Practice Manager'),
  ('Practice Nurse'),
  ('Healthcare Assistant'),
  ('Receptionist'),
  ('Admin'),
  ('Nurse Practitioner'),
  ('Phlebotomist'),
  ('Care Coordinator'),
  ('Dispensary'),
  ('Senior Partner')
) AS dept_list(dept_name)
WHERE ci.id IS NOT NULL
ON CONFLICT (company_id, name) DO NOTHING;

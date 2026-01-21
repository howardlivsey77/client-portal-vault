-- Create table for storing employee name aliases (remembered matches)
CREATE TABLE public.employee_name_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, source_name)
);

-- Enable RLS
ALTER TABLE public.employee_name_aliases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view aliases for companies they have access to
CREATE POLICY "Users can view employee aliases for their companies"
ON public.employee_name_aliases
FOR SELECT
USING (user_has_company_access(auth.uid(), company_id));

-- Policy: Company admins and payroll users can manage aliases
CREATE POLICY "Company admins and payroll can manage employee aliases"
ON public.employee_name_aliases
FOR ALL
USING (
  user_has_company_access(auth.uid(), company_id, 'admin') OR 
  user_has_company_access(auth.uid(), company_id, 'payroll') OR
  is_admin(auth.uid())
)
WITH CHECK (
  user_has_company_access(auth.uid(), company_id, 'admin') OR 
  user_has_company_access(auth.uid(), company_id, 'payroll') OR
  is_admin(auth.uid())
);

-- Create index for faster lookups
CREATE INDEX idx_employee_name_aliases_company_source 
ON public.employee_name_aliases(company_id, source_name);

-- Add trigger for updated_at
CREATE TRIGGER update_employee_name_aliases_updated_at
BEFORE UPDATE ON public.employee_name_aliases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add company_id column to payroll_results table
ALTER TABLE public.payroll_results 
ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Create index on company_id for better query performance
CREATE INDEX idx_payroll_results_company_id ON public.payroll_results(company_id);

-- Enable Row Level Security on payroll_results table
ALTER TABLE public.payroll_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to view payroll results only for companies they have access to
CREATE POLICY "Users can view payroll results for accessible companies" 
ON public.payroll_results 
FOR SELECT 
USING (
  public.user_has_company_access(auth.uid(), company_id)
);

-- Create RLS policy to allow users to insert payroll results only for companies they have access to
CREATE POLICY "Users can insert payroll results for accessible companies" 
ON public.payroll_results 
FOR INSERT 
WITH CHECK (
  public.user_has_company_access(auth.uid(), company_id)
);

-- Create RLS policy to allow users to update payroll results only for companies they have access to
CREATE POLICY "Users can update payroll results for accessible companies" 
ON public.payroll_results 
FOR UPDATE 
USING (
  public.user_has_company_access(auth.uid(), company_id)
);

-- Create RLS policy to allow users to delete payroll results only for companies they have access to
CREATE POLICY "Users can delete payroll results for accessible companies" 
ON public.payroll_results 
FOR DELETE 
USING (
  public.user_has_company_access(auth.uid(), company_id)
);

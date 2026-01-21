-- Create payroll_import_audit table for tracking imported vs paid reconciliation
CREATE TABLE public.payroll_import_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payroll_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE SET NULL,
  period_number INTEGER NOT NULL,
  financial_year INTEGER NOT NULL,
  import_type TEXT NOT NULL DEFAULT 'extra_hours',
  rate_type TEXT,
  imported_units NUMERIC(10,4),
  imported_rate NUMERIC(10,4),
  imported_value NUMERIC(12,2),
  source_file_name TEXT,
  source_row_reference TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_period_number CHECK (period_number >= 1 AND period_number <= 12),
  CONSTRAINT valid_import_type CHECK (import_type IN ('extra_hours', 'sickness', 'absence', 'expenses', 'adjustments'))
);

-- Create indexes for efficient querying
CREATE INDEX idx_payroll_import_audit_company ON public.payroll_import_audit(company_id);
CREATE INDEX idx_payroll_import_audit_employee ON public.payroll_import_audit(employee_id);
CREATE INDEX idx_payroll_import_audit_period ON public.payroll_import_audit(period_number, financial_year);
CREATE INDEX idx_payroll_import_audit_lookup ON public.payroll_import_audit(company_id, period_number, financial_year);

-- Enable RLS
ALTER TABLE public.payroll_import_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can access audit records for companies they have access to
CREATE POLICY "Users can view import audit for their companies"
ON public.payroll_import_audit
FOR SELECT
USING (
  public.is_admin(auth.uid()) 
  OR public.user_has_company_access(auth.uid(), company_id)
);

CREATE POLICY "Users with payroll access can insert import audit"
ON public.payroll_import_audit
FOR INSERT
WITH CHECK (
  public.is_admin(auth.uid()) 
  OR public.user_has_payroll_access(auth.uid(), company_id)
);

CREATE POLICY "Users with payroll access can update import audit"
ON public.payroll_import_audit
FOR UPDATE
USING (
  public.is_admin(auth.uid()) 
  OR public.user_has_payroll_access(auth.uid(), company_id)
);

CREATE POLICY "Users with payroll access can delete import audit"
ON public.payroll_import_audit
FOR DELETE
USING (
  public.is_admin(auth.uid()) 
  OR public.user_has_payroll_access(auth.uid(), company_id)
);

-- Add trigger for updated_at
CREATE TRIGGER update_payroll_import_audit_updated_at
BEFORE UPDATE ON public.payroll_import_audit
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.payroll_import_audit IS 'Audit trail for imported payroll data (extra hours, sickness, etc.) to enable imported vs paid reconciliation reports';
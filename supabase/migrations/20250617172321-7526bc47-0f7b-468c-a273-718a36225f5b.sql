
-- Create table for individual sickness absence records
CREATE TABLE public.employee_sickness_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  company_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  total_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_certified BOOLEAN DEFAULT FALSE,
  certification_required_from_day INTEGER DEFAULT 8,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT positive_days CHECK (total_days >= 0)
);

-- Create table for tracking entitlement usage per employee and scheme
CREATE TABLE public.employee_sickness_entitlement_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  company_id UUID NOT NULL,
  sickness_scheme_id UUID,
  entitlement_period_start DATE NOT NULL,
  entitlement_period_end DATE NOT NULL,
  
  -- Track usage for each pay tier
  full_pay_used_days DECIMAL(5,2) DEFAULT 0,
  half_pay_used_days DECIMAL(5,2) DEFAULT 0,
  
  -- Track remaining entitlements based on current service
  full_pay_entitled_days DECIMAL(5,2) DEFAULT 0,
  half_pay_entitled_days DECIMAL(5,2) DEFAULT 0,
  
  -- Current tier information
  current_service_months INTEGER DEFAULT 0,
  current_rule_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT positive_usage_full_pay CHECK (full_pay_used_days >= 0),
  CONSTRAINT positive_usage_half_pay CHECK (half_pay_used_days >= 0),
  CONSTRAINT positive_entitled_full_pay CHECK (full_pay_entitled_days >= 0),
  CONSTRAINT positive_entitled_half_pay CHECK (half_pay_entitled_days >= 0),
  CONSTRAINT valid_period CHECK (entitlement_period_end >= entitlement_period_start),
  
  -- Unique constraint for one entitlement period per employee per year
  UNIQUE(employee_id, entitlement_period_start)
);

-- Add foreign key relationships
ALTER TABLE public.employee_sickness_records 
ADD CONSTRAINT fk_sickness_records_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_sickness_records 
ADD CONSTRAINT fk_sickness_records_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.employee_sickness_entitlement_usage 
ADD CONSTRAINT fk_entitlement_usage_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_sickness_entitlement_usage 
ADD CONSTRAINT fk_entitlement_usage_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.employee_sickness_entitlement_usage 
ADD CONSTRAINT fk_entitlement_usage_scheme 
FOREIGN KEY (sickness_scheme_id) REFERENCES public.sickness_schemes(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_sickness_records_employee_date ON public.employee_sickness_records(employee_id, start_date);
CREATE INDEX idx_sickness_records_company ON public.employee_sickness_records(company_id);
CREATE INDEX idx_entitlement_usage_employee ON public.employee_sickness_entitlement_usage(employee_id);
CREATE INDEX idx_entitlement_usage_company ON public.employee_sickness_entitlement_usage(company_id);
CREATE INDEX idx_entitlement_usage_period ON public.employee_sickness_entitlement_usage(entitlement_period_start, entitlement_period_end);

-- Enable Row Level Security
ALTER TABLE public.employee_sickness_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_sickness_entitlement_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sickness records
CREATE POLICY "Users can view sickness records for their company employees" 
ON public.employee_sickness_records FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sickness_records.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id)
  )
);

CREATE POLICY "Admins can insert sickness records for their company employees" 
ON public.employee_sickness_records FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sickness_records.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id, 'admin')
  )
);

CREATE POLICY "Admins can update sickness records for their company employees" 
ON public.employee_sickness_records FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sickness_records.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id, 'admin')
  )
);

CREATE POLICY "Admins can delete sickness records for their company employees" 
ON public.employee_sickness_records FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sickness_records.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id, 'admin')
  )
);

-- Create RLS policies for entitlement usage
CREATE POLICY "Users can view entitlement usage for their company employees" 
ON public.employee_sickness_entitlement_usage FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sickness_entitlement_usage.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id)
  )
);

CREATE POLICY "Admins can manage entitlement usage for their company employees" 
ON public.employee_sickness_entitlement_usage FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sickness_entitlement_usage.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id, 'admin')
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sickness_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sickness_records_updated_at
  BEFORE UPDATE ON public.employee_sickness_records
  FOR EACH ROW EXECUTE FUNCTION update_sickness_updated_at();

CREATE TRIGGER update_entitlement_usage_updated_at
  BEFORE UPDATE ON public.employee_sickness_entitlement_usage
  FOR EACH ROW EXECUTE FUNCTION update_sickness_updated_at();

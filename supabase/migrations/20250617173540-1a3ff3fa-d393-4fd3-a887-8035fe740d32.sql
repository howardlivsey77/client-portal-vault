
-- Add opening balance fields to employee_sickness_entitlement_usage table
ALTER TABLE public.employee_sickness_entitlement_usage 
ADD COLUMN opening_balance_full_pay DECIMAL(5,2) DEFAULT 0,
ADD COLUMN opening_balance_half_pay DECIMAL(5,2) DEFAULT 0,
ADD COLUMN opening_balance_date DATE,
ADD COLUMN opening_balance_notes TEXT;

-- Create table for tracking historical sickness balances (pre-system usage)
CREATE TABLE public.employee_sickness_historical_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  company_id UUID NOT NULL,
  balance_date DATE NOT NULL,
  full_pay_days_used DECIMAL(5,2) DEFAULT 0,
  half_pay_days_used DECIMAL(5,2) DEFAULT 0,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  
  -- Constraints
  CONSTRAINT positive_historical_full_pay CHECK (full_pay_days_used >= 0),
  CONSTRAINT positive_historical_half_pay CHECK (half_pay_days_used >= 0),
  
  -- Unique constraint for one balance entry per employee per date
  UNIQUE(employee_id, balance_date)
);

-- Add foreign key relationships for historical balances
ALTER TABLE public.employee_sickness_historical_balances 
ADD CONSTRAINT fk_historical_balances_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_sickness_historical_balances 
ADD CONSTRAINT fk_historical_balances_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_historical_balances_employee_date ON public.employee_sickness_historical_balances(employee_id, balance_date);
CREATE INDEX idx_historical_balances_company ON public.employee_sickness_historical_balances(company_id);

-- Enable Row Level Security for historical balances
ALTER TABLE public.employee_sickness_historical_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for historical balances
CREATE POLICY "Users can view historical balances for their company employees" 
ON public.employee_sickness_historical_balances FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sickness_historical_balances.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id)
  )
);

CREATE POLICY "Admins can manage historical balances for their company employees" 
ON public.employee_sickness_historical_balances FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sickness_historical_balances.employee_id 
    AND user_has_company_access(auth.uid(), e.company_id, 'admin')
  )
);

-- Add trigger for updated_at on historical balances
CREATE TRIGGER update_historical_balances_updated_at
  BEFORE UPDATE ON public.employee_sickness_historical_balances
  FOR EACH ROW EXECUTE FUNCTION update_sickness_updated_at();

-- Add constraints for opening balance fields
ALTER TABLE public.employee_sickness_entitlement_usage 
ADD CONSTRAINT positive_opening_balance_full_pay CHECK (opening_balance_full_pay >= 0),
ADD CONSTRAINT positive_opening_balance_half_pay CHECK (opening_balance_half_pay >= 0);

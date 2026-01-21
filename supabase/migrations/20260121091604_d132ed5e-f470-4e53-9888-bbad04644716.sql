-- Create cost_centres table (mirrors departments structure)
CREATE TABLE public.cost_centres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Indexes for performance
CREATE INDEX idx_cost_centres_company ON public.cost_centres(company_id);
CREATE INDEX idx_cost_centres_active ON public.cost_centres(company_id, is_active);

-- Enable Row Level Security
ALTER TABLE public.cost_centres ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as departments)
CREATE POLICY "Users can view company cost centres"
  ON public.cost_centres
  FOR SELECT
  USING (user_has_company_access(auth.uid(), company_id) OR is_admin(auth.uid()));

CREATE POLICY "Admins can create cost centres"
  ON public.cost_centres
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update cost centres"
  ON public.cost_centres
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete cost centres"
  ON public.cost_centres
  FOR DELETE
  USING (is_admin(auth.uid()));
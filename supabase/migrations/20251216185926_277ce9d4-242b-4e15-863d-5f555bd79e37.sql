-- Create table for Teamnet rate configurations
CREATE TABLE public.teamnet_rate_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Standard Overtime Rates',
  default_rate INTEGER NOT NULL DEFAULT 2,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, name)
);

-- Add comment explaining the conditions structure
COMMENT ON COLUMN public.teamnet_rate_configs.conditions IS 'Array of rate conditions: [{rate: 3, days: ["Monday","Tuesday",...], time_from: "18:30", time_to: "20:00"}]';

-- Enable RLS
ALTER TABLE public.teamnet_rate_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (following sickness_schemes pattern)
CREATE POLICY "Users can view rate configs for their companies"
ON public.teamnet_rate_configs
FOR SELECT
USING (user_has_company_access(auth.uid(), company_id) OR is_admin(auth.uid()));

CREATE POLICY "Company admins can manage rate configs"
ON public.teamnet_rate_configs
FOR ALL
USING (user_has_company_access(auth.uid(), company_id, 'admin') OR is_admin(auth.uid()))
WITH CHECK (user_has_company_access(auth.uid(), company_id, 'admin') OR is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_teamnet_rate_configs_updated_at
BEFORE UPDATE ON public.teamnet_rate_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Company holiday settings (global toggle for UK bank holidays)
CREATE TABLE public.company_holiday_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  use_uk_bank_holidays BOOLEAN DEFAULT true,
  bank_holiday_rate INTEGER DEFAULT 3 CHECK (bank_holiday_rate IN (2, 3, 4)),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Custom company holidays
CREATE TABLE public.company_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  rate_override INTEGER DEFAULT 3 CHECK (rate_override IN (2, 3, 4)),
  all_day BOOLEAN DEFAULT true,
  time_from TIME,
  time_to TIME,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, date)
);

-- Enable RLS
ALTER TABLE public.company_holiday_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_holidays ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_holiday_settings
CREATE POLICY "Users can view holiday settings for their companies"
ON public.company_holiday_settings FOR SELECT
USING (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Company admins can manage holiday settings"
ON public.company_holiday_settings FOR ALL
USING (user_has_company_access(auth.uid(), company_id, 'admin') OR is_admin(auth.uid()))
WITH CHECK (user_has_company_access(auth.uid(), company_id, 'admin') OR is_admin(auth.uid()));

-- RLS policies for company_holidays
CREATE POLICY "Users can view holidays for their companies"
ON public.company_holidays FOR SELECT
USING (user_has_company_access(auth.uid(), company_id));

CREATE POLICY "Company admins can manage holidays"
ON public.company_holidays FOR ALL
USING (user_has_company_access(auth.uid(), company_id, 'admin') OR is_admin(auth.uid()))
WITH CHECK (user_has_company_access(auth.uid(), company_id, 'admin') OR is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_company_holiday_settings_updated_at
BEFORE UPDATE ON public.company_holiday_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_holidays_updated_at
BEFORE UPDATE ON public.company_holidays
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
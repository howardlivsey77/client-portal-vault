-- Create hmrc_submissions table to track FPS/EPS submissions
CREATE TABLE public.hmrc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tax_year VARCHAR(7) NOT NULL,
  tax_period INTEGER NOT NULL CHECK (tax_period >= 1 AND tax_period <= 12),
  submission_type TEXT NOT NULL CHECK (submission_type IN ('FPS', 'EPS')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'not_required')),
  submitted_at TIMESTAMPTZ,
  response_message TEXT,
  payments INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, tax_year, tax_period, submission_type)
);

-- Enable RLS
ALTER TABLE public.hmrc_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view HMRC submissions for their companies"
ON public.hmrc_submissions
FOR SELECT
USING (user_has_company_access(auth.uid(), company_id) OR is_admin(auth.uid()));

CREATE POLICY "Company admins can manage HMRC submissions"
ON public.hmrc_submissions
FOR ALL
USING (user_has_company_access(auth.uid(), company_id, 'admin') OR is_admin(auth.uid()))
WITH CHECK (user_has_company_access(auth.uid(), company_id, 'admin') OR is_admin(auth.uid()));

-- Create index for performance
CREATE INDEX idx_hmrc_submissions_company_year ON public.hmrc_submissions(company_id, tax_year);

-- Add updated_at trigger
CREATE TRIGGER update_hmrc_submissions_updated_at
BEFORE UPDATE ON public.hmrc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
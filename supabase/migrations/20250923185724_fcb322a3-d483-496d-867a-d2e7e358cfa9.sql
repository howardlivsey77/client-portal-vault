-- Create tables for monitoring and compliance features

-- Data retention policies table
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL,
  retention_period_months integer NOT NULL,
  auto_delete boolean NOT NULL DEFAULT false,
  legal_hold_override boolean NOT NULL DEFAULT false,
  company_id uuid REFERENCES public.companies(id),
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Data retention jobs table
CREATE TABLE IF NOT EXISTS public.data_retention_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES public.data_retention_policies(id) ON DELETE CASCADE,
  scheduled_date timestamp with time zone NOT NULL,
  execution_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  records_identified integer NOT NULL DEFAULT 0,
  records_processed integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Legal holds table
CREATE TABLE IF NOT EXISTS public.legal_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id),
  table_name text NOT NULL,
  record_id uuid,
  reason text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  notes text
);

-- Erasure requests table
CREATE TABLE IF NOT EXISTS public.erasure_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) NOT NULL,
  requester_id uuid NOT NULL,
  request_date timestamp with time zone NOT NULL DEFAULT now(),
  completion_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  erasure_method text NOT NULL,
  reason text NOT NULL,
  legal_basis text,
  retention_override boolean DEFAULT false,
  affected_tables text[] DEFAULT '{}',
  records_processed integer DEFAULT 0,
  total_records integer DEFAULT 0,
  verification_hash text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Data export requests table
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) NOT NULL,
  requester_id uuid NOT NULL,
  request_date timestamp with time zone NOT NULL DEFAULT now(),
  completion_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  export_format text NOT NULL,
  export_scope text NOT NULL,
  include_historical boolean DEFAULT false,
  file_path text,
  file_size bigint,
  download_count integer DEFAULT 0,
  expires_at timestamp with time zone NOT NULL,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erasure_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for data retention policies (admin only)
CREATE POLICY "Only admins can manage retention policies" 
ON public.data_retention_policies 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for data retention jobs (admin only)
CREATE POLICY "Only admins can manage retention jobs" 
ON public.data_retention_jobs 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for legal holds (admin only)
CREATE POLICY "Only admins can manage legal holds" 
ON public.legal_holds 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for erasure requests
CREATE POLICY "Admins can view all erasure requests" 
ON public.erasure_requests 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create erasure requests" 
ON public.erasure_requests 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update erasure requests" 
ON public.erasure_requests 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own erasure requests" 
ON public.erasure_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = erasure_requests.employee_id 
    AND user_id = auth.uid()
  )
);

-- RLS policies for data export requests
CREATE POLICY "Admins can view all export requests" 
ON public.data_export_requests 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create export requests" 
ON public.data_export_requests 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update export requests" 
ON public.data_export_requests 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own export requests" 
ON public.data_export_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = data_export_requests.employee_id 
    AND user_id = auth.uid()
  )
);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_data_retention_policies_updated_at 
BEFORE UPDATE ON public.data_retention_policies 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_retention_jobs_updated_at 
BEFORE UPDATE ON public.data_retention_jobs 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erasure_requests_updated_at 
BEFORE UPDATE ON public.erasure_requests 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_export_requests_updated_at 
BEFORE UPDATE ON public.data_export_requests 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
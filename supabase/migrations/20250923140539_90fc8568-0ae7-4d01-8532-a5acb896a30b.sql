-- Complete the database integrity implementation

-- Create audit table for tracking working days discrepancies
CREATE TABLE IF NOT EXISTS public.sickness_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date,
  stored_total_days numeric NOT NULL,
  calculated_total_days numeric NOT NULL,
  difference numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  audit_type text NOT NULL,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  notes text
);

-- Enable RLS on audit table
ALTER TABLE public.sickness_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for audit table
CREATE POLICY "Admins can view sickness audit logs"
ON public.sickness_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = sickness_audit_log.employee_id
    AND user_has_company_access(auth.uid(), e.company_id, 'admin')
  )
);

-- Function to validate working days on sickness records
CREATE OR REPLACE FUNCTION public.validate_sickness_working_days()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_days numeric;
  tolerance numeric := 0.1;
BEGIN
  calculated_days := public.calculate_working_days(
    NEW.start_date, 
    NEW.end_date, 
    NEW.employee_id
  );
  
  -- Log discrepancies
  IF abs(NEW.total_days - calculated_days) > tolerance THEN
    INSERT INTO public.sickness_audit_log (
      record_id, employee_id, start_date, end_date,
      stored_total_days, calculated_total_days, difference,
      audit_type
    ) VALUES (
      COALESCE(NEW.id, gen_random_uuid()),
      NEW.employee_id, NEW.start_date, NEW.end_date,
      NEW.total_days, calculated_days, NEW.total_days - calculated_days,
      'working_days_mismatch'
    );
  END IF;
  
  -- Auto-correct significant differences
  IF abs(NEW.total_days - calculated_days) > 1 THEN
    NEW.total_days := calculated_days;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on sickness records
DROP TRIGGER IF EXISTS validate_sickness_working_days_trigger ON public.employee_sickness_records;
CREATE TRIGGER validate_sickness_working_days_trigger
  BEFORE INSERT OR UPDATE ON public.employee_sickness_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sickness_working_days();

-- Function for daily integrity check
CREATE OR REPLACE FUNCTION public.run_sickness_integrity_check()
RETURNS TABLE (
  employee_id uuid,
  record_id uuid,
  start_date date,
  end_date date,
  stored_days numeric,
  calculated_days numeric,
  difference numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.employee_id,
    sr.id as record_id,
    sr.start_date,
    sr.end_date,
    sr.total_days as stored_days,
    public.calculate_working_days(sr.start_date, sr.end_date, sr.employee_id) as calculated_days,
    sr.total_days - public.calculate_working_days(sr.start_date, sr.end_date, sr.employee_id) as difference
  FROM public.employee_sickness_records sr
  WHERE abs(sr.total_days - public.calculate_working_days(sr.start_date, sr.end_date, sr.employee_id)) > 0.1
  ORDER BY sr.created_at DESC;
END;
$$;
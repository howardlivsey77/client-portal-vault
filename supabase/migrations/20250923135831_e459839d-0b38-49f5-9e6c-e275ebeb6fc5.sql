-- Create database triggers and functions for working days validation

-- Function to calculate working days between dates
CREATE OR REPLACE FUNCTION public.calculate_working_days(
  start_date date,
  end_date date,
  employee_id uuid
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  working_days numeric := 0;
  current_date date;
  day_name text;
  work_pattern record;
BEGIN
  -- Return 0 if invalid inputs
  IF start_date IS NULL OR employee_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- If no end date, check if start date is a working day
  IF end_date IS NULL THEN
    day_name := to_char(start_date, 'Day');
    day_name := trim(day_name);
    
    SELECT COUNT(*) INTO working_days
    FROM work_patterns
    WHERE employee_id = calculate_working_days.employee_id
    AND day ILIKE day_name
    AND is_working = true;
    
    RETURN COALESCE(working_days, 0);
  END IF;
  
  -- Return 0 if start is after end
  IF start_date > end_date THEN
    RETURN 0;
  END IF;
  
  -- Iterate through each day and count working days
  current_date := start_date;
  WHILE current_date <= end_date LOOP
    day_name := to_char(current_date, 'Day');
    day_name := trim(day_name);
    
    -- Check if this day is a working day for the employee
    IF EXISTS (
      SELECT 1 FROM work_patterns
      WHERE employee_id = calculate_working_days.employee_id
      AND day ILIKE day_name
      AND is_working = true
    ) THEN
      working_days := working_days + 1;
    END IF;
    
    current_date := current_date + interval '1 day';
  END LOOP;
  
  RETURN working_days;
END;
$$;

-- Function to validate working days on sickness records
CREATE OR REPLACE FUNCTION public.validate_sickness_working_days()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_days numeric;
  tolerance numeric := 0.1; -- Allow small rounding differences
BEGIN
  -- Calculate expected working days
  calculated_days := public.calculate_working_days(
    NEW.start_date, 
    NEW.end_date, 
    NEW.employee_id
  );
  
  -- If total_days is very different from calculated, log warning
  IF abs(NEW.total_days - calculated_days) > tolerance THEN
    -- Insert audit record for investigation
    INSERT INTO public.sickness_audit_log (
      record_id,
      employee_id,
      start_date,
      end_date,
      stored_total_days,
      calculated_total_days,
      difference,
      created_at,
      audit_type
    ) VALUES (
      COALESCE(NEW.id, gen_random_uuid()),
      NEW.employee_id,
      NEW.start_date,
      NEW.end_date,
      NEW.total_days,
      calculated_days,
      NEW.total_days - calculated_days,
      now(),
      'working_days_mismatch'
    );
  END IF;
  
  -- Auto-correct if the difference is significant (more than 1 day)
  IF abs(NEW.total_days - calculated_days) > 1 THEN
    NEW.total_days := calculated_days;
  END IF;
  
  RETURN NEW;
END;
$$;

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

-- Create trigger on sickness records
CREATE TRIGGER validate_sickness_working_days_trigger
  BEFORE INSERT OR UPDATE ON public.employee_sickness_records
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sickness_working_days();

-- Create function for daily integrity check
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
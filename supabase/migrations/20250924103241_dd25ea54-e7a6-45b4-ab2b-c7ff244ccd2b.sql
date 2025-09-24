-- Fix the search path security warning for remaining functions
CREATE OR REPLACE FUNCTION public.run_sickness_integrity_check()
RETURNS TABLE(employee_id uuid, record_id uuid, start_date date, end_date date, stored_days numeric, calculated_days numeric, difference numeric)
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
-- Create database triggers and functions for working days validation (fixed)

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
  iter_date date;
  day_name text;
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
  iter_date := start_date;
  WHILE iter_date <= end_date LOOP
    day_name := to_char(iter_date, 'Day');
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
    
    iter_date := iter_date + interval '1 day';
  END LOOP;
  
  RETURN working_days;
END;
$$;
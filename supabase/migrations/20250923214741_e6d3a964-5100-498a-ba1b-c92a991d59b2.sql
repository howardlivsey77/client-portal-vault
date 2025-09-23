-- Fix the search path security warning by updating the function
DROP FUNCTION IF EXISTS public.create_employee_with_system_user(jsonb, uuid, uuid);

CREATE OR REPLACE FUNCTION public.create_employee_with_system_user(
  employee_data jsonb,
  creator_user_id uuid,
  target_company_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_employee_id uuid;
BEGIN
  -- Verify the creator has permission to create employees in this company
  IF NOT (public.is_admin(creator_user_id) OR public.user_has_company_access(creator_user_id, target_company_id, 'admin')) THEN
    RAISE EXCEPTION 'Insufficient permissions to create employee in this company';
  END IF;
  
  -- Insert the employee with creator as the user_id (for now, until we implement individual accounts)
  INSERT INTO public.employees (
    first_name, last_name, department, hours_per_week, hourly_rate,
    email, address1, address2, address3, address4, postcode,
    date_of_birth, hire_date, payroll_id, gender, national_insurance_number,
    tax_code, nic_code, work_pattern, week_one_month_one, student_loan_plan,
    rate_2, rate_3, rate_4, user_id, company_id, status
  )
  SELECT 
    (employee_data->>'first_name')::text,
    (employee_data->>'last_name')::text,
    (employee_data->>'department')::text,
    (employee_data->>'hours_per_week')::numeric,
    (employee_data->>'hourly_rate')::numeric,
    (employee_data->>'email')::text,
    (employee_data->>'address1')::text,
    (employee_data->>'address2')::text,
    (employee_data->>'address3')::text,
    (employee_data->>'address4')::text,
    (employee_data->>'postcode')::text,
    (employee_data->>'date_of_birth')::date,
    (employee_data->>'hire_date')::date,
    (employee_data->>'payroll_id')::text,
    (employee_data->>'gender')::text,
    (employee_data->>'national_insurance_number')::text,
    (employee_data->>'tax_code')::text,
    (employee_data->>'nic_code')::text,
    (employee_data->>'work_pattern')::text,
    COALESCE((employee_data->>'week_one_month_one')::boolean, false),
    (employee_data->>'student_loan_plan')::integer,
    (employee_data->>'rate_2')::numeric,
    (employee_data->>'rate_3')::numeric,
    (employee_data->>'rate_4')::numeric,
    creator_user_id,
    target_company_id,
    COALESCE((employee_data->>'status')::text, 'active')
  RETURNING id INTO new_employee_id;
  
  RETURN new_employee_id;
END;
$$;
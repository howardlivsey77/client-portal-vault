
-- Delete all employee-related records for The Swan Practice
-- First, let's find the company ID for The Swan Practice
DO $$
DECLARE
    swan_company_id uuid;
BEGIN
    -- Get The Swan Practice company ID
    SELECT id INTO swan_company_id 
    FROM public.companies 
    WHERE name ILIKE '%Swan Practice%' OR trading_as ILIKE '%Swan Practice%'
    LIMIT 1;
    
    IF swan_company_id IS NOT NULL THEN
        -- Delete work patterns for employees of The Swan Practice
        DELETE FROM public.work_patterns 
        WHERE employee_id IN (
            SELECT id FROM public.employees WHERE company_id = swan_company_id
        );
        
        -- Delete timesheet entries for employees of The Swan Practice
        DELETE FROM public.timesheet_entries 
        WHERE employee_id IN (
            SELECT id FROM public.employees WHERE company_id = swan_company_id
        );
        
        -- Delete payroll results for employees of The Swan Practice
        DELETE FROM public.payroll_results 
        WHERE employee_id IN (
            SELECT id FROM public.employees WHERE company_id = swan_company_id
        );
        
        -- Delete payroll employee details for employees of The Swan Practice
        DELETE FROM public.payroll_employee_details 
        WHERE employee_id IN (
            SELECT id::text FROM public.employees WHERE company_id = swan_company_id
        );
        
        -- Finally, delete the employees themselves
        DELETE FROM public.employees WHERE company_id = swan_company_id;
        
        RAISE NOTICE 'Deleted all employee records and related data for The Swan Practice (company_id: %)', swan_company_id;
    ELSE
        RAISE NOTICE 'The Swan Practice company not found';
    END IF;
END $$;

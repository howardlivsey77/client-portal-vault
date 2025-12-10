-- Insert all unique department names from employees table into departments table
-- This syncs the departments table with existing employee department values
INSERT INTO departments (company_id, name, is_active, created_at, updated_at)
SELECT DISTINCT 
  e.company_id,
  e.department,
  true,
  NOW(),
  NOW()
FROM employees e
WHERE e.department IS NOT NULL 
  AND e.department != ''
  AND e.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM departments d 
    WHERE d.company_id = e.company_id 
    AND d.name = e.department
  );
-- Fix hire dates that were incorrectly shifted by timezone conversion
-- Adding 1 day to correct the off-by-one error for Spring Hall employees
UPDATE employees 
SET hire_date = hire_date + INTERVAL '1 day'
WHERE company_id = '921e2826-f21c-4c3e-9656-3a5a8321a47e'
  AND hire_date IS NOT NULL;
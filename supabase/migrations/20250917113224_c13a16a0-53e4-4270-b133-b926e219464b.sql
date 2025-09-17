-- Add a simple unique constraint to prevent exact duplicate records
-- This will catch the most common case of duplicate entries
ALTER TABLE employee_sickness_records 
ADD CONSTRAINT unique_employee_sickness_period 
UNIQUE (employee_id, start_date, end_date);

-- Add national_insurance_number column to employees table
ALTER TABLE public.employees 
ADD COLUMN national_insurance_number text;

-- Add comment to describe the field
COMMENT ON COLUMN public.employees.national_insurance_number IS 'UK National Insurance Number in format: QQ123456C';

-- Add employee status management fields
ALTER TABLE public.employees 
ADD COLUMN leave_date date,
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'on-hold', 'leaver'));

-- Create index for status filtering
CREATE INDEX idx_employees_status ON public.employees(status);

-- Create index for leave_date filtering  
CREATE INDEX idx_employees_leave_date ON public.employees(leave_date);
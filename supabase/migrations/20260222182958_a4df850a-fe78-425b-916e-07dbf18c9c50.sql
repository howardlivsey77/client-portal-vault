
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS hours_worked_band text
CHECK (hours_worked_band IN ('A', 'B', 'C', 'D', 'E'));

COMMENT ON COLUMN public.employees.hours_worked_band IS 
'HMRC FPS HoursWorked band: A=up to 15hrs, B=16-23.99hrs, C=24-29.99hrs, D=30hrs+, E=Other. Required for Full Payment Submission.';

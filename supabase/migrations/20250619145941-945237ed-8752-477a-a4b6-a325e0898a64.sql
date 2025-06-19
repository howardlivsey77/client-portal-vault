
-- Add NHS pension related fields to employees table
ALTER TABLE public.employees 
ADD COLUMN nhs_pension_member boolean DEFAULT false,
ADD COLUMN previous_year_pensionable_pay numeric DEFAULT NULL,
ADD COLUMN nhs_pension_tier integer DEFAULT NULL,
ADD COLUMN nhs_pension_employee_rate numeric DEFAULT NULL;

-- Add NHS pension fields to payroll_results table
ALTER TABLE public.payroll_results
ADD COLUMN nhs_pension_employee_this_period integer DEFAULT 0,
ADD COLUMN nhs_pension_employer_this_period integer DEFAULT 0,
ADD COLUMN nhs_pension_employee_ytd integer DEFAULT 0,
ADD COLUMN nhs_pension_employer_ytd integer DEFAULT 0,
ADD COLUMN nhs_pension_tier integer DEFAULT NULL,
ADD COLUMN nhs_pension_employee_rate numeric DEFAULT NULL,
ADD COLUMN nhs_pension_employer_rate numeric DEFAULT NULL;

-- Create NHS pension contribution bands table for reference
CREATE TABLE public.nhs_pension_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year text NOT NULL,
  tier_number integer NOT NULL,
  annual_pensionable_pay_from integer NOT NULL,
  annual_pensionable_pay_to integer,
  employee_contribution_rate numeric NOT NULL,
  employer_contribution_rate numeric NOT NULL DEFAULT 14.38,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert 2025/26 NHS pension contribution rates
INSERT INTO public.nhs_pension_bands (
  tax_year, tier_number, annual_pensionable_pay_from, annual_pensionable_pay_to, 
  employee_contribution_rate, employer_contribution_rate
) VALUES
('2025/26', 1, 0, 1376700, 5.0, 14.38),           -- £0 - £13,767
('2025/26', 2, 1376700, 2705700, 5.6, 14.38),     -- £13,767 - £27,057
('2025/26', 3, 2705700, 3119900, 7.1, 14.38),     -- £27,057 - £31,199
('2025/26', 4, 3119900, 4699900, 9.3, 14.38),     -- £31,199 - £46,999
('2025/26', 5, 4699900, 5679900, 10.5, 14.38),    -- £46,999 - £56,799
('2025/26', 6, 5679900, 7959900, 11.7, 14.38),    -- £56,799 - £79,599
('2025/26', 7, 7959900, 10959900, 12.5, 14.38),   -- £79,599 - £109,599
('2025/26', 8, 10959900, 15309900, 13.5, 14.38),  -- £109,599 - £153,099
('2025/26', 9, 15309900, NULL, 14.5, 14.38);      -- £153,099+

-- Enable RLS on NHS pension bands table
ALTER TABLE public.nhs_pension_bands ENABLE ROW LEVEL SECURITY;

-- Create policy for NHS pension bands (readable by all authenticated users)
CREATE POLICY "Authenticated users can view NHS pension bands" 
ON public.nhs_pension_bands 
FOR SELECT 
TO authenticated 
USING (true);

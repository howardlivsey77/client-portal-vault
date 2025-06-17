
-- Add company_id column to sickness_schemes table
ALTER TABLE public.sickness_schemes 
ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Update existing schemes to link them to companies based on naming patterns
-- This assumes schemes with "Swan" in the name belong to "The Swan Practice"
UPDATE public.sickness_schemes 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE name ILIKE '%swan%' 
  LIMIT 1
)
WHERE name ILIKE '%swan%';

-- For any remaining unlinked schemes, you may need to manually assign them
-- or create a more specific mapping based on your data

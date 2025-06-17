
-- Update the three unlinked sickness schemes to be associated with The Swan Practice
-- Using ILIKE pattern matching to handle any whitespace variations
UPDATE public.sickness_schemes 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE name = 'The Swan Practice'
  LIMIT 1
)
WHERE (
  name ILIKE '%North End Sick Pay Entitlement%' OR
  name ILIKE '%Verney Close Sick Pay Entitlement%' OR
  name ILIKE '%Masonic House Sick Pay Entitlement%'
)
AND company_id IS NULL;


-- Update the three unlinked sickness schemes to be associated with The Swan Practice
UPDATE public.sickness_schemes 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE name = 'The Swan Practice'
  LIMIT 1
)
WHERE name IN (
  'North End Sick Pay Entitlement',
  'Verney Close Sick Pay Entitlement', 
  'Masonic House Sick Pay Entitlement'
)
AND company_id IS NULL;

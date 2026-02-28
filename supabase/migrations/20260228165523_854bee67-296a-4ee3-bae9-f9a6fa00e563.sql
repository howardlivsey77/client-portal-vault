
ALTER TABLE public.companies ADD COLUMN tax_office_number text;
ALTER TABLE public.companies ADD COLUMN tax_office_reference text;

UPDATE public.companies
SET tax_office_number = split_part(paye_ref, '/', 1),
    tax_office_reference = split_part(paye_ref, '/', 2)
WHERE paye_ref IS NOT NULL AND paye_ref LIKE '%/%';

ALTER TABLE public.companies DROP COLUMN paye_ref;

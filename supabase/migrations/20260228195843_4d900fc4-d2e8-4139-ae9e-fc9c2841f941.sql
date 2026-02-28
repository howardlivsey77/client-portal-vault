ALTER TABLE payroll_constants ADD COLUMN IF NOT EXISTS tax_year TEXT;

UPDATE payroll_constants
SET tax_year = CASE
  WHEN EXTRACT(MONTH FROM effective_from) >= 4
  THEN EXTRACT(YEAR FROM effective_from)::TEXT || '-' ||
       SUBSTRING((EXTRACT(YEAR FROM effective_from) + 1)::TEXT FROM 3)
  ELSE (EXTRACT(YEAR FROM effective_from) - 1)::TEXT || '-' ||
       SUBSTRING(EXTRACT(YEAR FROM effective_from)::TEXT FROM 3)
END
WHERE tax_year IS NULL;
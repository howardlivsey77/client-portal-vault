-- Standardise tax_year format from hyphen to slash in payroll_constants
UPDATE payroll_constants SET tax_year = REPLACE(tax_year, '-', '/') WHERE tax_year LIKE '%-__';
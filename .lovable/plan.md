

# Split PAYE Reference into Tax Office Number and Reference

## Overview
Replace the single `paye_ref` column with two separate fields: a 3-digit **Tax Office Number** (e.g. "120") and the **Employer PAYE Reference** (e.g. "BB58856"). These map directly to the HMRC FPS XML fields `TaxOfficeNumber` and `TaxOfficeReference`.

## Database Migration
- Add two new columns to `companies`: `tax_office_number` (text) and `tax_office_reference` (text)
- Migrate existing `paye_ref` data by splitting on the "/" delimiter (e.g. "120/BB58856" becomes "120" and "BB58856")
- Drop the `paye_ref` column after migration

## UI Changes (HmrcInfoSection)
Replace the single "PAYE Reference" field with two fields displayed side-by-side:
- **Tax Office Number** -- 3-character input with `maxLength={3}`, placeholder "e.g. 120"
- **Employer PAYE Reference** -- text input, placeholder "e.g. BB58856"

## Technical Changes

### 1. Database migration
```sql
ALTER TABLE companies ADD COLUMN tax_office_number text;
ALTER TABLE companies ADD COLUMN tax_office_reference text;

UPDATE companies
SET tax_office_number = split_part(paye_ref, '/', 1),
    tax_office_reference = split_part(paye_ref, '/', 2)
WHERE paye_ref IS NOT NULL AND paye_ref LIKE '%/%';

ALTER TABLE companies DROP COLUMN paye_ref;
```

### 2. Update types
- `src/types/company.ts` -- replace `paye_ref` with `tax_office_number` and `tax_office_reference`
- `src/integrations/supabase/types.ts` -- same replacement in Row/Insert/Update types
- `src/features/company-settings/types.ts` -- replace `payeRef` with `taxOfficeNumber` and `taxOfficeReference`

### 3. Update HMRC form hook (`useHmrcInfoForm.ts`)
- Change form values interface: replace `payeRef` with `taxOfficeNumber` and `taxOfficeReference`
- Update `reset()` and `onSubmit()` to use the two new DB columns

### 4. Update HmrcInfoSection component
- Replace single PAYE Reference field with two fields in a sub-grid
- Tax Office Number: `maxLength={3}`, small width
- Employer PAYE Reference: standard width

### 5. Update FPS edge function (`generate-fps/config.ts`)
- Instead of reading from environment secrets, load `tax_office_number` and `tax_office_reference` from the company record in the database (passed in the request or queried)
- This removes the need for `HMRC_TAX_OFFICE_NUMBER` and `HMRC_TAX_OFFICE_REFERENCE` environment secrets

### 6. Update other consumers
- `src/features/company-management/components/CompanyForm.tsx` -- split paye_ref into two fields
- `src/components/dashboard/reports/payslip/PayslipReport.tsx` -- construct display as `${tax_office_number}/${tax_office_reference}`
- `src/components/dashboard/reports/payslip/mockData.ts` -- update mock data
- `src/hooks/reports/useP11Report.ts` -- update query to select new columns; construct combined ref for display

## Files Changed

| File | Action |
|------|--------|
| Migration SQL | Create (add columns, migrate data, drop old column) |
| `src/types/company.ts` | Edit (replace paye_ref) |
| `src/integrations/supabase/types.ts` | Edit (replace paye_ref) |
| `src/features/company-settings/types.ts` | Edit (replace payeRef) |
| `src/features/company-settings/hooks/useHmrcInfoForm.ts` | Edit (two fields) |
| `src/features/company-settings/components/HmrcInfoSection.tsx` | Edit (two inputs) |
| `src/features/company-management/components/CompanyForm.tsx` | Edit (split field) |
| `src/components/dashboard/reports/payslip/PayslipReport.tsx` | Edit (construct from two fields) |
| `src/components/dashboard/reports/payslip/mockData.ts` | Edit (update mock) |
| `src/hooks/reports/useP11Report.ts` | Edit (query new columns) |
| `supabase/functions/generate-fps/config.ts` | Edit (use DB values) |
| `supabase/functions/generate-fps/types.ts` | No change needed (already has separate fields) |


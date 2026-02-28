

# Fix Tax Year Format and Standardise Financial Data

## Problem
There are two different tax year formats in the database causing duplicate entries in the selector:
- `nic_bands`, `nhs_pension_bands`, `tax_bands` use **"2025/26"** (slash)
- `payroll_constants` uses **"2025-26"** and **"2023-24"** (hyphen)

This results in the dropdown showing both "2025/26" and "2025-26" as separate years, and data not matching across tabs.

## Solution

### 1. Standardise on "2025/26" format everywhere
Update all `payroll_constants` records to use the slash format via a data update:
- "2025-26" becomes "2025/26"
- "2023-24" becomes "2023/24"

### 2. Fix CopyTaxYearDialog format handling
Currently it validates `^\d{4}-\d{2}$` and parses with `split("-")`. Update to:
- Accept format "2026/27" (slash)
- Parse effective dates using slash split
- Update placeholder text accordingly

### 3. Fix TaxYearSelector
- No code changes needed (it already aggregates from all tables) -- once data is consistent, duplicates disappear

### 4. Update placeholder text across all manager components
Change all placeholder references from "2025-26" to "2025/26" in:
- `PayrollConstantsManager.tsx` (field def placeholder)
- `TaxBandsManager.tsx` (field def placeholder)
- `NhsPensionBandsManager.tsx` (field def placeholder)

## Technical Details

### Data fix (via insert/update tool, not migration)
```sql
UPDATE payroll_constants SET tax_year = REPLACE(tax_year, '-', '/') WHERE tax_year LIKE '%-__';
```

### File changes

| File | Change |
|------|--------|
| `CopyTaxYearDialog.tsx` | Change regex to `^\d{4}/\d{2}$`, parse with `split("/")`, update placeholder to "2026/27" |
| `PayrollConstantsManager.tsx` | Change placeholder from "2025-26" to "2025/26" |
| `TaxBandsManager.tsx` | Change placeholder from "2025-26" to "2025/26" |
| `NhsPensionBandsManager.tsx` | Change placeholder from "2025-26" to "2025/26" |

This is a small, focused fix -- once the data format is consistent, the existing TaxYearSelector and all grid/table components will work correctly since they already filter by `tax_year` equality.


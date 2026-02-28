

# Reorganise Financial Data by Tax Year with NIC Grid Layout

## Overview
Restructure the Financial Data page to be driven by a **global tax year selector** at the top, and redesign the NIC Bands tab to show data in **collapsible grid panels** matching the reference images (Thresholds grid + Employee Rates grid + Employer Rates grid), with inline editing. Also add a "Copy from previous year" feature when creating a new tax year.

## What Changes

### 1. Add `tax_year` column to `payroll_constants`
The `payroll_constants` table currently uses `effective_from`/`effective_to` but has no `tax_year` column. The other three tables (nic_bands, nhs_pension_bands, tax_bands) already have `tax_year`. A migration will:
- Add a `tax_year TEXT` column to `payroll_constants`
- Back-fill existing rows with the appropriate tax year derived from `effective_from` (e.g. rows effective from 2025-04-06 get "2025-26")

### 2. Global Tax Year Selector
Replace the current flat layout with a **tax year dropdown** at the top of the Financial Data page:
- Populated from distinct `tax_year` values found across all four tables
- An "Add Tax Year" button to create a new year (with option to copy from an existing year)
- Selected year is passed down to all four tab components, which filter their data accordingly

### 3. NIC Bands Tab - Grid Layout
Redesign `NicBandsManager.tsx` to show three **collapsible accordion sections** for the selected tax year:

**Section 1: National Insurance Thresholds**
- Two-column grid layout (per month | per week)
- Rows: LEL, PT, ST, UEL (and any others like UST, AUST if present)
- Values editable inline with Save/Cancel buttons
- Data source: `payroll_constants` where `category = 'NI_THRESHOLDS'` and `tax_year` matches
- Weekly values derived by dividing monthly by (12/52) or stored separately

**Section 2: Employee Contribution Rates**
- Grid with NI category letters (A, B, C, H, J, M, Z, X) as rows
- Columns: "Earnings at or above LEL up to and including PT", "Earnings above PT up to and including UEL", "Balance of earnings above UEL"
- Values are percentages, editable inline
- Data source: `payroll_constants` where `category = 'NI_EMPLOYEE_RATES'` and `tax_year` matches

**Section 3: Employer Contribution Rates**
- Same grid layout as employee rates but for employer
- Data source: `payroll_constants` where `category = 'NI_EMPLOYER_RATES'` and `tax_year` matches

Each section has Save and Cancel buttons at the bottom (matching the reference images).

### 4. Other Tabs - Tax Year Filtering
- **Payroll Constants**: Filter by selected tax year, show remaining categories (STUDENT_LOAN, NI_RATES, etc.) in the existing table format. NI-specific categories are handled by the NIC tab.
- **Tax Bands**: Filter by selected tax year (already has `tax_year` column)
- **NHS Pension Bands**: Filter by selected tax year (already has `tax_year` column)

### 5. Copy from Previous Year
When creating a new tax year:
- Show a dialog with a text input for the new year (e.g. "2026-27") and a dropdown to select a source year to copy from
- On confirm, duplicate all rows from the source year across all four tables, updating `tax_year`, `effective_from`, `effective_to`, and `is_current` fields appropriately

## Technical Details

### Database Migration
```sql
ALTER TABLE payroll_constants ADD COLUMN IF NOT EXISTS tax_year TEXT;

-- Back-fill based on effective_from date
UPDATE payroll_constants
SET tax_year = CASE
  WHEN EXTRACT(MONTH FROM effective_from) >= 4
  THEN EXTRACT(YEAR FROM effective_from)::TEXT || '-' ||
       SUBSTRING((EXTRACT(YEAR FROM effective_from) + 1)::TEXT FROM 3)
  ELSE (EXTRACT(YEAR FROM effective_from) - 1)::TEXT || '-' ||
       SUBSTRING(EXTRACT(YEAR FROM effective_from)::TEXT FROM 3)
END
WHERE tax_year IS NULL;
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/financial-data/TaxYearSelector.tsx` | Global year picker + "Add Tax Year" button |
| `src/components/financial-data/CopyTaxYearDialog.tsx` | Dialog for creating a new year with copy-from option |
| `src/components/financial-data/NicThresholdsGrid.tsx` | Inline-editable thresholds grid (LEL, PT, ST, UEL) |
| `src/components/financial-data/NicRatesGrid.tsx` | Inline-editable rates grid (category letters x earnings bands) |

### Files to Edit
| File | Change |
|------|--------|
| `src/pages/FinancialData.tsx` | Add global tax year state, pass to all tabs |
| `src/components/financial-data/NicBandsManager.tsx` | Replace table with accordion of grids |
| `src/components/financial-data/PayrollConstantsManager.tsx` | Accept `taxYear` prop, filter data, exclude NI categories |
| `src/components/financial-data/TaxBandsManager.tsx` | Accept `taxYear` prop, filter data |
| `src/components/financial-data/NhsPensionBandsManager.tsx` | Accept `taxYear` prop, filter data |
| `src/components/financial-data/useFinancialData.ts` | Support optional `taxYear` filter parameter |

### Data Flow
```text
FinancialData page
  |-- TaxYearSelector (selected: "2025-26")
  |-- Tabs
       |-- NIC Bands tab
       |    |-- NicThresholdsGrid (payroll_constants, NI_THRESHOLDS, 2025-26)
       |    |-- NicRatesGrid (payroll_constants, NI_EMPLOYEE_RATES, 2025-26)
       |    |-- NicRatesGrid (payroll_constants, NI_EMPLOYER_RATES, 2025-26)
       |-- Payroll Constants tab (filtered, excl. NI categories)
       |-- Tax Bands tab (filtered)
       |-- NHS Pension tab (filtered)
```


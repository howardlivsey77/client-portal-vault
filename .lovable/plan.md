

# Financial Data Admin Section

## Overview
Create a new "Financial Data" section in the sidebar, visible only to admin users, providing full CRUD management for the four reference data tables used by the payroll engine: **Payroll Constants**, **NIC Bands**, **NHS Pension Bands**, and **Tax Bands**.

## What You'll Get
- A new "Financial Data" item in the sidebar (admin-only, with a suitable icon like `Database` or `Landmark`)
- A dedicated page at `/financial-data` with a tabbed interface to switch between the four data tables
- Each tab shows a data table with inline editing, add new, and delete capabilities
- All changes write directly to the existing Supabase tables
- The page is protected so only admin users can access it

## Structure

```text
/financial-data
  +-- Tab: Payroll Constants
  |     Table view grouped by category
  |     Columns: key, category, description, value_numeric, value_text, region, effective_from, effective_to, is_current
  |     Add / Edit / Delete rows
  |
  +-- Tab: NIC Bands
  |     Columns: tax_year, ni_class, name, region, contribution_type, threshold_from, threshold_to, rate, effective_from, is_current
  |     Add / Edit / Delete rows
  |
  +-- Tab: NHS Pension Bands
  |     Columns: tax_year, tier_number, annual_pensionable_pay_from, annual_pensionable_pay_to, employee_contribution_rate, employer_contribution_rate, effective_from, is_current
  |     Add / Edit / Delete rows
  |
  +-- Tab: Tax Bands
  |     Columns: tax_year, name, region, threshold_from, threshold_to, rate, effective_from, is_current
  |     Add / Edit / Delete rows
```

## Technical Plan

### 1. Add sidebar navigation item
**File**: `src/components/layout/sidebar/SidebarMainNavigation.tsx`
- Add a new nav item with `allowedRoles: ['admin']` pointing to `/financial-data`
- Use the `Landmark` icon from lucide-react

### 2. Create the Financial Data page
**File**: `src/pages/FinancialData.tsx`
- Wrapped in `PageContainer` for consistent layout
- Uses Radix `Tabs` component with four tabs
- Each tab renders a dedicated management component

### 3. Create management components (one per table)
**Directory**: `src/components/financial-data/`

Files to create:
- `index.ts` -- barrel exports
- `PayrollConstantsManager.tsx` -- CRUD for `payroll_constants`
- `NicBandsManager.tsx` -- CRUD for `nic_bands`
- `NhsPensionBandsManager.tsx` -- CRUD for `nhs_pension_bands`
- `TaxBandsManager.tsx` -- CRUD for `tax_bands`
- `FinancialDataForm.tsx` -- reusable dialog form for add/edit operations
- `useFinancialData.ts` -- shared hook for fetching, inserting, updating, deleting rows from any of the four tables

Each manager component will:
- Fetch data using `supabase.from(tableName).select('*')` ordered by `tax_year` desc, then relevant sort fields
- Display in a table using existing UI table components
- Provide "Add New" button opening a dialog form
- Allow inline row editing via an edit icon that opens the same dialog pre-filled
- Allow deletion with the existing `useConfirmation()` hook for safe destructive actions
- Show toast notifications on success/failure

### 4. Add RLS policies for admin write access
**Database migration** needed for `payroll_constants`, `nic_bands`, `nhs_pension_bands`:
- Currently these tables only have SELECT policies for authenticated users and no INSERT/UPDATE/DELETE policies
- Add ALL policy for admins using `is_admin(auth.uid())` on each table
- `tax_bands` table needs verification -- add matching policies if missing

```sql
-- payroll_constants already has admin ALL policy, so skip

-- NIC bands: add admin management policy
CREATE POLICY "Admins can manage NIC bands"
  ON public.nic_bands FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- NHS pension bands: add admin management policy
CREATE POLICY "Admins can manage NHS pension bands"
  ON public.nhs_pension_bands FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Tax bands: verify and add if needed
CREATE POLICY "Admins can manage tax bands"
  ON public.tax_bands FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
```

### 5. Register the route
**File**: `src/App.tsx`
- Add route under the `adminOnly` `ProtectedLayout` group:
  ```tsx
  <Route path="/financial-data" element={<FinancialData />} />
  ```

### 6. Validation
- Use zod schemas to validate form inputs before submission
- Numeric fields (thresholds, rates) validated as numbers
- Required fields enforced (tax_year, key/name, rates)
- Date fields validated as valid date strings

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/components/layout/sidebar/SidebarMainNavigation.tsx` |
| Edit | `src/App.tsx` |
| Create | `src/pages/FinancialData.tsx` |
| Create | `src/components/financial-data/index.ts` |
| Create | `src/components/financial-data/PayrollConstantsManager.tsx` |
| Create | `src/components/financial-data/NicBandsManager.tsx` |
| Create | `src/components/financial-data/NhsPensionBandsManager.tsx` |
| Create | `src/components/financial-data/TaxBandsManager.tsx` |
| Create | `src/components/financial-data/useFinancialData.ts` |
| Create | `src/components/financial-data/FinancialDataForm.tsx` |
| Migration | RLS policies for nic_bands, nhs_pension_bands, tax_bands |


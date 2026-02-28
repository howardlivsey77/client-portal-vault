

# Comprehensive Financial Data Fix: Seed 2025/26 and Fill UI Gaps

## Problem Summary
1. **Stale 2023/24 data** still in `payroll_constants` (NI_RATES, NI_THRESHOLDS, STUDENT_LOAN) causing it to appear in the year selector
2. **Incomplete 2025/26 NI thresholds** -- only ST exists; LEL, PT, UEL are missing
3. **No student loan data for 2025/26** -- only exists for 2023/24 with outdated values
4. **Missing NI categories** -- only A, C, H, M are seeded; B, J, V, Z are missing for both employee and employer rates
5. **NIC rates display bug** -- rates stored as decimals (e.g. 0.08) but shown as "0.08%" instead of "8%"
6. **No Student Loans tab** in the Financial Data UI -- these constants have nowhere to be viewed/edited
7. **Payroll Constants tab is empty for 2025/26** because all data is NI-related and excluded

## Plan

### 1. Database: Delete stale 2023/24 data
Remove old records from `payroll_constants` where `tax_year = '2023/24'` (categories NI_RATES, NI_THRESHOLDS, STUDENT_LOAN). This ensures the year selector only shows 2025/26.

### 2. Database: Seed missing 2025/26 NI Thresholds
Insert missing `payroll_constants` records for category `NI_THRESHOLDS`, tax_year `2025/26`:
- LEL: 542 (monthly)
- PT: 1048 (monthly)
- UEL: 4189 (monthly)
- UST: 4189 (monthly)
- AUST: 4189 (monthly)

(ST = 417 already exists)

### 3. Database: Seed 2025/26 Student Loan constants
Insert `payroll_constants` records for category `STUDENT_LOAN`, tax_year `2025/26` using current HMRC 2025/26 values from the hardcoded constants:

| Key | Monthly Threshold | Rate |
|-----|-------------------|------|
| PLAN_1_THRESHOLD | 2172.08 | -- |
| PLAN_1_RATE | -- | 0.09 |
| PLAN_2_THRESHOLD | 2372.50 | -- |
| PLAN_2_RATE | -- | 0.09 |
| PLAN_4_THRESHOLD | 2728.75 | -- |
| PLAN_4_RATE | -- | 0.09 |
| PGL_THRESHOLD | 1750.00 | -- |
| PGL_RATE | -- | 0.06 |

### 4. Database: Seed missing NIC band categories
Add `nic_bands` rows for 2025/26 for the missing NI letters (B, J, V, Z) for both Employee and Employer contribution types, using the correct rate groups from the hardcoded constants:

**Employee rates:**
- B (Reduced): 1.85% PT-UEL, 2% above UEL
- J (Deferment): 2% PT-UEL, 2% above UEL
- V (Standard): 8% PT-UEL, 2% above UEL
- Z (Deferment): 2% PT-UEL, 2% above UEL

**Employer rates:**
- B: 15% above ST (standard)
- J: 15% above ST (standard)
- V: 0% to UST, 15% above (zero to secondary threshold)
- Z: 0% to AUST, 15% above (zero to secondary threshold)

### 5. UI: Add Student Loans tab
Create `StudentLoansManager.tsx` -- a grid-based view (similar to NicThresholdsGrid) showing student loan thresholds and rates for the selected tax year. Reads from `payroll_constants` where `category = 'STUDENT_LOAN'`. Add as a new tab in the Financial Data page.

### 6. UI: Fix NIC rates display
In `NicRatesGrid.tsx`, the rate is displayed as `{row.rate}%` but rates are stored as decimals (0.08). Fix to display as `{(row.rate * 100).toFixed(2)}%` so 0.08 renders as "8.00%".

### 7. UI: Rename Payroll Constants tab to "General Constants"
Update the tab label and exclude `STUDENT_LOAN` category (alongside existing NI exclusions) since student loans now have their own tab.

### 8. UI: Update tab order
Reorder tabs to: NIC Bands | Tax Bands | Student Loans | NHS Pension Bands | General Constants

## Technical Details

### Migration SQL (single migration)
```sql
-- 1. Delete stale 2023/24 data
DELETE FROM payroll_constants WHERE tax_year = '2023/24';

-- 2. Seed missing NI thresholds for 2025/26
INSERT INTO payroll_constants (category, key, value_numeric, description, tax_year, region, effective_from, is_current)
VALUES
  ('NI_THRESHOLDS', 'LEL', 542, 'Lower Earnings Limit (monthly)', '2025/26', 'UK', '2025-04-06', true),
  ('NI_THRESHOLDS', 'PT', 1048, 'Primary Threshold (monthly)', '2025/26', 'UK', '2025-04-06', true),
  ('NI_THRESHOLDS', 'UEL', 4189, 'Upper Earnings Limit (monthly)', '2025/26', 'UK', '2025-04-06', true),
  ('NI_THRESHOLDS', 'UST', 4189, 'Upper Secondary Threshold (monthly)', '2025/26', 'UK', '2025-04-06', true),
  ('NI_THRESHOLDS', 'AUST', 4189, 'Apprentice Upper Secondary Threshold (monthly)', '2025/26', 'UK', '2025-04-06', true);

-- 3. Seed student loan constants for 2025/26
INSERT INTO payroll_constants (category, key, value_numeric, description, tax_year, region, effective_from, is_current)
VALUES
  ('STUDENT_LOAN', 'PLAN_1_THRESHOLD', 2172.08, 'Plan 1 monthly threshold', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_1_RATE', 0.09, 'Plan 1 repayment rate', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_2_THRESHOLD', 2372.50, 'Plan 2 monthly threshold', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_2_RATE', 0.09, 'Plan 2 repayment rate', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_4_THRESHOLD', 2728.75, 'Plan 4 monthly threshold', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PLAN_4_RATE', 0.09, 'Plan 4 repayment rate', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PGL_THRESHOLD', 1750.00, 'Postgraduate Loan monthly threshold', '2025/26', 'UK', '2025-04-06', true),
  ('STUDENT_LOAN', 'PGL_RATE', 0.06, 'Postgraduate Loan repayment rate', '2025/26', 'UK', '2025-04-06', true);

-- 4. Seed missing NIC bands (B, J, V, Z)
-- Employee bands
INSERT INTO nic_bands (tax_year, ni_class, contribution_type, name, threshold_from, threshold_to, rate, region, effective_from, is_current)
VALUES
  -- Class B (Reduced)
  ('2025/26', 'B', 'Employee', 'LEL to PT', 0, 54200, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'B', 'Employee', 'PT to UEL', 54200, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'B', 'Employee', 'PT to UEL', 104800, 418900, 0.0185, 'UK', '2025-04-06', true),
  ('2025/26', 'B', 'Employee', 'Above UEL', 418900, NULL, 0.02, 'UK', '2025-04-06', true),
  -- Class J (Deferment)
  ('2025/26', 'J', 'Employee', 'LEL to PT', 0, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'J', 'Employee', 'PT to UEL', 104800, 418900, 0.02, 'UK', '2025-04-06', true),
  ('2025/26', 'J', 'Employee', 'Above UEL', 418900, NULL, 0.02, 'UK', '2025-04-06', true),
  -- Class V (Standard employee, zero employer to UST)
  ('2025/26', 'V', 'Employee', 'LEL to PT', 0, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'V', 'Employee', 'PT to UEL', 104800, 418900, 0.08, 'UK', '2025-04-06', true),
  ('2025/26', 'V', 'Employee', 'Above UEL', 418900, NULL, 0.02, 'UK', '2025-04-06', true),
  -- Class Z (Deferment, zero employer to AUST)
  ('2025/26', 'Z', 'Employee', 'LEL to PT', 0, 104800, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'Z', 'Employee', 'PT to UEL', 104800, 418900, 0.02, 'UK', '2025-04-06', true),
  ('2025/26', 'Z', 'Employee', 'Above UEL', 418900, NULL, 0.02, 'UK', '2025-04-06', true);

-- Employer bands
INSERT INTO nic_bands (tax_year, ni_class, contribution_type, name, threshold_from, threshold_to, rate, region, effective_from, is_current)
VALUES
  -- Class B (Standard employer)
  ('2025/26', 'B', 'Employer', 'Below ST', 0, 41700, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'B', 'Employer', 'Above ST', 41700, NULL, 0.15, 'UK', '2025-04-06', true),
  -- Class J (Standard employer)
  ('2025/26', 'J', 'Employer', 'Below ST', 0, 41700, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'J', 'Employer', 'Above ST', 41700, NULL, 0.15, 'UK', '2025-04-06', true),
  -- Class V (Zero to UST)
  ('2025/26', 'V', 'Employer', 'Below UST', 0, 418900, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'V', 'Employer', 'Above UST', 418900, NULL, 0.15, 'UK', '2025-04-06', true),
  -- Class Z (Zero to AUST)
  ('2025/26', 'Z', 'Employer', 'Below AUST', 0, 418900, 0.00, 'UK', '2025-04-06', true),
  ('2025/26', 'Z', 'Employer', 'Above AUST', 418900, NULL, 0.15, 'UK', '2025-04-06', true);
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/financial-data/StudentLoansManager.tsx` | Grid view for student loan thresholds and rates per tax year |

### Files to Edit
| File | Change |
|------|--------|
| `src/components/financial-data/NicRatesGrid.tsx` | Fix rate display: `(row.rate * 100).toFixed(2)%` instead of `row.rate%` |
| `src/pages/FinancialData.tsx` | Add Student Loans tab, rename "Payroll Constants" to "General Constants", reorder tabs |
| `src/components/financial-data/PayrollConstantsManager.tsx` | Add `STUDENT_LOAN` to excluded categories list |
| `src/components/financial-data/index.ts` | Export `StudentLoansManager` |


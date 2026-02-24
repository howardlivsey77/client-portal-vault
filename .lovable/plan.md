

# Fix: Rolling 12-Month Sickness Calculation

## The Problem

Two issues cause incorrect sickness entitlement totals:

1. **`recalculateEmployeeUsedDays`** filters sickness records by **calendar year** (Jan 1 - Dec 31), missing records from the previous year that fall within the rolling window.

2. **The rolling window reference point**: The system should look back 12 months from the **most recent sickness event** (not from today, and not using the "first sickness anniversary" method).

For example, if the most recent sickness starts on 9 Feb 2026, the rolling window should be **10 Feb 2025 - 9 Feb 2026**, capturing all sickness events in that span.

## What Changes

### 1. `src/services/employees/sickness/entitlementService.ts` -- `recalculateEmployeeUsedDays`

Replace the calendar year logic (lines 214-263) with:

- Fetch **all** sickness records for the employee (no date filter), sorted by `start_date` descending
- Take the most recent record's `start_date` as the reference date
- Call `calculationUtils.getRolling12MonthPeriod(mostRecentStartDate)` to get the rolling window
- Filter records using overlap logic (same as `balanceService.calculateRolling12MonthUsage`): include a record if its start date is within the window OR its end date is within/after the window start
- Keep the existing chronological allocation logic (waiting days, full pay first, then half pay)
- Update the entitlement record lookup to find the record covering the current year (this part stays the same -- we're only changing which sickness records feed into the calculation)

### 2. `src/services/employees/sickness/calculationUtils.ts` -- `getActualRollingPeriod`

Update this method (used by the UI display) so it also anchors to the most recent sickness event:

- Fetch all sickness records sorted descending
- Use the most recent record's `start_date` as the reference date (instead of the first-sickness anniversary chain)
- Return `getRolling12MonthPeriod(mostRecentStartDate)`
- If no records exist, fall back to `getRolling12MonthPeriod()` (today minus 12 months)

This ensures the displayed rolling period dates match what `recalculateEmployeeUsedDays` computes.

### 3. `src/utils/sickness/sicknessCalculations.ts` -- No structural changes

This file already passes a `referenceDate` through to `calculateRolling12MonthUsageFromDate` and `calculateSspUsageFromDate`. It reads stored `full_pay_used_days` / `half_pay_used_days` from the entitlement table, which will now be correct after the recalculation fix.

## Expected Result

For an employee with:
- Record 1: 7 Oct 2025 (1 day)
- Record 2: 11 Nov 2025 (6 days)  
- Record 3: 9 Feb 2026 (2 days)

The rolling window becomes **10 Feb 2025 - 9 Feb 2026**. All three records fall within this window. After waiting days deductions (if applicable), the used days will reflect all 9 working days rather than just the 2 from 2026.

## Technical Notes

- The entitlement period record in `employee_sickness_entitlement_usage` is still keyed by year -- we only change which sickness records are summed into `full_pay_used_days` / `half_pay_used_days`
- The overlap check logic: `recordStart <= windowEnd AND recordEnd >= windowStart` (treating single-day records where `end_date` is null as `end_date = start_date`)
- No database schema changes required


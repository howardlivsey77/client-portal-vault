

# Fix: Trigger Entitlement Recalculation

## The Problem

The rolling 12-month calculation logic is correct in `entitlementService.ts`, but it never gets called. The "Recalculate Totals" button only updates working days per record — it does not recalculate the entitlement used days. The display reads stale stored values from the database.

## The Fix

Two changes ensure the new rolling window logic actually runs:

### 1. `src/components/employees/details/sickness/SicknessRecordsList.tsx`

Add a call to `sicknessService.recalculateEmployeeUsedDays(employeeId)` at the end of `handleRecalculateTotals`, so clicking "Recalculate Totals" also recalculates entitlement used days (not just working days per record). Then call `onRecordsUpdated()` to refresh the UI.

### 2. `src/hooks/employees/useSicknessData.ts`

Add a call to `sicknessService.recalculateEmployeeUsedDays(employee.id)` inside `fetchSicknessData`, after records are loaded but before setting state. This ensures entitlement used days are always recalculated on page load using the rolling window logic, so the display is never stale.

## Expected Result

After these changes:
- Opening the employee sickness page will automatically recalculate used days with the rolling 12-month window
- Clicking "Recalculate Totals" will also update entitlement used days
- The display should show the correct totals accounting for all 3 sickness records (Oct 2025, Nov 2025, Feb 2026)


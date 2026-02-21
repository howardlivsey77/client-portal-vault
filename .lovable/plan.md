

# Fix: Remove Early Rounding in Pension Calculations

## Problem

Two pension calculation files round their results before passing them to `assemblePayrollResult`, which rounds again at the output boundary. This double-rounding violates the documented HMRC rounding strategy ("all rounding occurs at the OUTPUT boundary only") and risks penny drift in edge cases.

**Affected files:**
- `src/services/payroll/calculations/nhs-pension.ts` (lines 171-172)
- `src/services/payroll/calculations/pension.ts` (line 9)

## Changes

### 1. `src/services/payroll/calculations/pension.ts`

Remove the `roundToTwoDecimals` call and the now-unused import:

```text
Before:  return roundToTwoDecimals(monthlySalary * (pensionPercentage / 100));
After:   return monthlySalary * (pensionPercentage / 100);
```

Remove the `import { roundToTwoDecimals }` line since it will no longer be used.

### 2. `src/services/payroll/calculations/nhs-pension.ts`

Remove the two `roundToTwoDecimals` calls on lines 171-172:

```text
Before:  const employeeContribution = roundToTwoDecimals(monthlySalary * employeeRate);
         const employerContribution = roundToTwoDecimals(monthlySalary * employerRate);

After:   const employeeContribution = monthlySalary * employeeRate;
         const employerContribution = monthlySalary * employerRate;
```

If `roundToTwoDecimals` is no longer used elsewhere in this file, remove that import too.

## What does NOT change

- `assemblePayrollResult` in `payrollCalculator.ts` already applies `roundToTwoDecimals` to both `pensionContribution`, `nhsPensionEmployeeContribution`, and `nhsPensionEmployerContribution` at the output boundary -- no changes needed there
- Public API signatures and return types remain identical
- No database or dependency changes

## Risk

Minimal. In most cases the output will be identical since `assemblePayrollResult` re-rounds anyway. In rare edge cases where double-rounding caused a 1p drift, results will now be more accurate.


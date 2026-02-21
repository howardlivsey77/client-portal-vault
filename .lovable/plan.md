

# Refactor: Decompose `payrollCalculator.ts` into Phase Functions

## Summary

Replace the current ~230-line monolithic `calculateMonthlyPayroll` function with 5 focused phase helpers plus a lightweight orchestrator. The user has provided the complete target code -- this is a direct replacement.

## What Changes

Single file: `src/services/payroll/payrollCalculator.ts`

| Section | Current | After |
|---------|---------|-------|
| `calculateMonthlyPayroll` | ~190 lines, all logic inline | ~35 lines, orchestrator only |
| Earnings | Inline (lines 67-74) | `calculateEarnings()` ~15 lines |
| Tax | Inline (lines 77-98) | `calculateTaxDeductions()` ~25 lines |
| NI | Inline (lines 100-133) | `calculateNIContributions()` ~30 lines |
| Pension | Inline (lines 139-166) | `calculatePensionDeductions()` ~35 lines |
| Result assembly | Inline (lines 168-217) | `assemblePayrollResult()` ~45 lines |

## Key Improvements

- **Parallel execution**: Tax, NI, and pension run concurrently via `Promise.all` (performance win)
- **Every function under 50 lines**: All phase helpers stay within the target
- **Inter-phase types**: `EarningsResult`, `TaxResult`, `NIResult`, `PensionResult` make data flow explicit
- **Individually testable**: `calculateEarnings` and `assemblePayrollResult` are pure functions; the async phases can be tested with mocked dependencies

## What Does NOT Change

- Public API: `calculateMonthlyPayroll` signature and `PayrollResult` return type are identical
- Error handling: Same `PayrollCalculationError` codes and patterns
- Rounding strategy: All `roundToTwoDecimals` calls remain in `assemblePayrollResult` only
- Re-exports at the bottom of the file
- No new files, dependencies, or database changes

## Type Verification

- `nhsPensionTier` is `number` in both the proposed `PensionResult` interface and the existing `PayrollResult` type -- confirmed aligned

## Technical Detail

The file will be replaced with the user-provided code in full. The implementation:
1. Adds 4 private inter-phase interfaces (`EarningsResult`, `TaxResult`, `NIResult`, `PensionResult`)
2. Adds 5 private helper functions (not exported -- internal to the module)
3. Rewrites `calculateMonthlyPayroll` as a pipeline orchestrator
4. Preserves all imports and re-exports exactly as they are


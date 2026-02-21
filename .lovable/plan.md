

# Unit Tests for Payroll Phase Functions

## Overview

Create a comprehensive test suite for 4 of the 5 phase functions in `payrollCalculator.ts`. Since the phase functions are currently private (not exported), we need to expose them for testing without changing the public API.

## Step 1 — Extract phase functions to an internal module

Create `src/services/payroll/payrollCalculator.internal.ts` containing:
- The 4 inter-phase result type interfaces (`EarningsResult`, `TaxResult`, `NIResult`, `PensionResult`)
- The 4 phase functions: `calculateEarnings`, `calculateTaxDeductions`, `calculateNIContributions`, `assemblePayrollResult`
- All necessary imports (logger, rounding utils, income-tax, NI calculator, etc.)

Then update `payrollCalculator.ts` to import these functions and types from the internal module instead of defining them inline. The public API (`calculateMonthlyPayroll` signature, re-exports) stays exactly the same.

## Step 2 — Create the test file

Create `src/services/payroll/payrollCalculator.test.ts` with the test structure specified.

### Mocking strategy

- **payrollLogger**: Mock globally to suppress log output and prevent `import.meta.env` issues in test
- **calculateMonthlyIncomeTaxAsync**: Mock for `calculateTaxDeductions` tests
- **NationalInsuranceCalculator**: Mock for `calculateNIContributions` tests
- **Supabase**: Already mocked globally in `setupTests.ts`

### Test groups

**Phase 1 -- calculateEarnings** (10 tests, pure function)
- Basic: no earnings, single item, multiple items, empty array, null/undefined fallback, totalAdditionalEarnings correctness
- Edge: zero salary with earnings, negative amounts, large values, fractional pennies

**Phase 2 -- assemblePayrollResult** (17 tests, pure function)
- Totals: netPay formula, totalDeductions composition, totalAllowances, zero-deduction case, with additionalDeductions, with additionalAllowances
- Rounding: all monetary fields rounded to 2dp, nhsPensionTier NOT rounded, pensionPercentage NOT rounded, rates NOT rounded
- Pass-through: employeeId, employeeName, payrollId, taxCode, studentLoanPlan, isNHSPensionMember, arrays passed unchanged

**Phase 3 -- calculateTaxDeductions** (9 tests, async with mock)
- Happy path: returns incomeTax, returns freePay, taxablePay floored, taxablePay clamped to 0
- Rounding: two specific floor scenarios
- Errors: throws PayrollCalculationError with INCOME_TAX_FAILED, context includes taxCode/taxYear/employeeId, wraps original error

**Phase 4 -- calculateNIContributions** (8 tests, async with mock)
- Happy path: returns NI, employer NI, all 5 band values, passes grossPay and taxYear correctly
- Errors: throws PayrollCalculationError with NI_CALCULATION_FAILED, context includes taxYear/employeeId, wraps original error

### Shared test fixtures

Defined at the top of the test file: `baseDetails`, `baseEarnings`, `baseTax`, `baseNI`, `basePensions` as specified in the requirements.

## Technical details

### Why a separate internal file (not underscore exports)?

- Keeps the main `payrollCalculator.ts` focused on orchestration
- Avoids polluting the public barrel exports (`export *`) with internal functions
- The internal file is a standard pattern for exposing private functions to tests

### What does NOT change

- `calculateMonthlyPayroll` signature and behaviour
- Re-exports at the bottom of `payrollCalculator.ts`
- `calculatePensionDeductions` stays private (tested separately later)
- Error handling in phase functions
- The `roundToTwoDecimals` import from `@/lib/formatters` (which handles null/undefined) used in `assemblePayrollResult`

### Note on roundToTwoDecimals

`assemblePayrollResult` uses the version from `@/lib/formatters` which returns `number | null`. Tests will verify that for standard numeric inputs, results are rounded to 2dp. The rounding "not applied" tests for tier/percentage/rates will verify those fields keep their original values.


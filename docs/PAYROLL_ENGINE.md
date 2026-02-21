# Payroll Engine — Developer Documentation

> **Last updated:** February 2026
> **Tax year:** 2025/26 and 2026/27
> **Regulatory basis:** HMRC PAYE Manual, SLC guidance for software developers

---

## Overview

The payroll engine calculates monthly PAYE deductions for UK employees. It lives in `src/services/payroll/` and follows an **orchestrator pattern** with five calculation phases executed via `calculateMonthlyPayroll()`.

All monetary values are in **pounds (£)** throughout the pipeline. Rounding occurs only at the output boundary in Phase 5.

---

## File Structure

```
src/services/payroll/
├── payrollCalculator.ts          # Public API — orchestrator
├── payrollCalculator.internal.ts # Phase functions (unit-testable)
├── payrollCalculator.test.ts     # 118+ tests
├── types.ts                      # PayrollDetails, PayrollResult
├── calculations/
│   ├── income-tax.ts             # Income tax (async, DB-backed bands)
│   ├── cumulative-tax.ts         # Cumulative and W1/M1 tax
│   ├── student-loan.ts           # Student loan repayments
│   ├── pension.ts                # Standard pension (percentage-based)
│   ├── nhs-pension.ts            # NHS Pension (tiered, DB-backed)
│   ├── national-insurance.ts     # NI re-export (backward compat)
│   └── ni/                       # NI calculation engine
│       ├── services/
│       │   └── NationalInsuranceCalculator.ts
│       ├── earnings-bands.ts     # LEL/PT/UEL band splitting
│       ├── calculation-utils.ts
│       ├── database-calculation.ts
│       ├── database.ts
│       ├── fallback-calculation.ts
│       ├── errors.ts
│       ├── types.ts
│       └── index.ts
├── constants/
│   └── tax-constants.ts          # Tax bands, NI thresholds, student loan thresholds
├── database/
│   ├── payrollDatabaseService.ts
│   └── operations/
├── errors/
│   ├── PayrollCalculationError.ts
│   └── payroll-errors.ts
├── utils/
│   ├── tax-code-utils.ts         # Parse tax codes (1257L, K codes, BR, etc.)
│   ├── tax-bands-utils.ts        # DB-backed tax bands with cache
│   ├── taxYearUtils.ts           # getCurrentTaxYear()
│   ├── financial-year-utils.ts
│   ├── roundingUtils.ts          # roundDownToNearestPound
│   └── payrollLogger.ts          # Structured logging
└── validation/
    └── payroll-validators.ts
```

---

## Calculation Pipeline

### Input: `PayrollDetails`

```ts
interface PayrollDetails {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
  taxCode: string;                                        // e.g. "1257L", "K100", "BR"
  pensionPercentage?: number;                             // 0-100
  studentLoanPlan?: 1 | 2 | 4 | 'PGL' | null;
  additionalDeductions?: Array<{ description, amount }>;
  additionalAllowances?: Array<{ description, amount }>;
  additionalEarnings?: Array<{ description, amount }>;
  reimbursements?: Array<{ description, amount }>;        // Non-NI-able expenses
  isNHSPensionMember?: boolean;
  previousYearPensionablePay?: number | null;
  taxYear?: string;                                       // e.g. "2025/26"
  niCategory?: NICategory;                                // A/B/C/M/H/Z/J/V
}
```

### Phase 1 — Earnings (`calculateEarnings`)

```
grossPay       = monthlySalary + additionalEarnings + reimbursements
niableGrossPay = monthlySalary + additionalEarnings
```

**Key concept:** Reimbursements are non-NI-able expense repayments. They appear in gross pay on the payslip but are excluded from all deduction calculations (NI, tax, pension, student loan).

### Phase 2 — Income Tax (`calculateTaxDeductions`)

1. Parse tax code → extract annual personal allowance
2. Fetch tax bands from database (fallback to `tax-constants.ts`)
3. Calculate annual tax on `niableGrossPay × 12`
4. Divide by 12 for monthly tax (full precision)
5. Compute `taxablePay = roundDownToNearestPound(niableGrossPay - freePay)`

**Tax code types supported:**
- Standard: `1257L` → £12,570 allowance
- K codes: `K100` → negative allowance (adds to taxable income)
- Emergency: `1257L W1`, `1257L M1` → non-cumulative
- Flat rate: `BR` (20%), `D0` (40%), `D1` (45%)
- Scottish: `S1257L` → Scottish tax bands
- Zero tax: `NT`

### Phase 3 — National Insurance (`calculateNIContributions`)

Runs concurrently with Phases 2 and 4 via `Promise.all`.

**NI Category Letters (2025/26):**

| Category | Employee Rate Group | Employer Rate Group | Description |
|----------|-------------------|-------------------|-------------|
| A | STANDARD (8%/2%) | STANDARD (15% > ST) | Standard employee |
| B | REDUCED (1.85%/2%) | STANDARD | Married women/widows |
| C | OVER_SPA (0%/0%) | STANDARD | Over State Pension Age |
| M | STANDARD | ZERO_TO_UST | Under 21 |
| H | STANDARD | ZERO_TO_UST | Apprentice under 25 |
| V | STANDARD | ZERO_TO_UST | Veteran |
| J | DEFERMENT (2%/2%) | STANDARD | Deferment |
| Z | DEFERMENT | ZERO_TO_UST | Apprentice <25, deferment |

**Employee rate groups:**
- STANDARD: 8% between PT–UEL, 2% above UEL
- REDUCED: 1.85% between PT–UEL, 2% above UEL
- OVER_SPA: 0% (no employee NI)
- DEFERMENT: 2% between PT–UEL, 2% above UEL

**Employer rate:** 15% above Secondary Threshold (£417/month).
Exception: Categories M/H/V/Z pay 0% from ST up to UST (£4,189/month), then 15% above.

**NI Thresholds (2025/26 monthly):**

| Threshold | Monthly |
|-----------|---------|
| LEL (Lower Earnings Limit) | £542 |
| PT (Primary Threshold) | £1,048 |
| ST (Secondary Threshold) | £417 |
| UEL (Upper Earnings Limit) | £4,189 |
| UST/AUST/VUST | £4,189 |

**Earnings band output:** The result includes earnings split across bands (at LEL, LEL→PT, PT→UEL, above UEL, above ST) for FPS reporting.

### Phase 4 — Pensions (`calculatePensionDeductions`)

**Standard pension:** `niableGrossPay × (pensionPercentage / 100)`

**NHS Pension:**
- Tiers fetched from `nhs_pension_bands` table
- Tier determined by previous year's pensionable pay (or current annual salary × 12)
- Employee and employer rates applied to `monthlySalary` (contractual pay, not gross)
- Returns: `employeeContribution`, `employerContribution`, `tier`, rates

### Student Loan (`calculateStudentLoan`)

Calculated after Promise.all completes, using `niableGrossPay`.

| Plan | Monthly Threshold | Rate |
|------|------------------|------|
| 1 | £2,172.08 | 9% |
| 2 | £2,372.50 | 9% |
| 4 | £2,728.75 | 9% |
| PGL | £1,750.00 | 6% |

**Rounding:** `Math.floor()` — rounded DOWN to nearest pound per HMRC spec. This differs from standard 2dp rounding used elsewhere.

**PGL** (Postgraduate Loan) can run alongside one plan type (1, 2, or 4). Plan 5 does not exist in HMRC guidance.

### Phase 5 — Result Assembly (`assemblePayrollResult`)

All rounding to 2 decimal places occurs here via `roundToTwoDecimals()`. No earlier phase rounds its output.

```ts
totalDeductions = incomeTax + NI + studentLoan + pension + nhsPension + additionalDeductions
netPay = grossPay - totalDeductions + totalAllowances
```

### Output: `PayrollResult`

The result includes all fields needed for:
- **Payslip display** — gross, deductions, net, reimbursements
- **FPS submission** — NI earnings bands, tax code, NI category
- **YTD accumulation** — via `payroll_results` table
- **NHS Pension reporting** — tier, rates, contributions

---

## Rounding Strategy

| What | Method | Why |
|------|--------|-----|
| Intermediate calculations | Full precision | Prevent penny drift |
| Taxable pay | `roundDownToNearestPound()` | HMRC requirement |
| Student loan repayment | `Math.floor()` | HMRC spec: round DOWN to nearest pound |
| All final output values | `roundToTwoDecimals()` | Standard currency display |
| Database storage | Pennies as integers | Exact storage |

⚠️ **WARNING:** Do not re-add rounded values in downstream systems to avoid penny drift.

---

## Error Handling

All calculation phases throw `PayrollCalculationError` with structured error codes:

| Code | Phase | Meaning |
|------|-------|---------|
| `INVALID_INPUT` | Validation | Bad input data |
| `INCOME_TAX_FAILED` | Phase 2 | Tax calculation error |
| `NI_CALCULATION_FAILED` | Phase 3 | NI calculation error |
| `NHS_PENSION_FAILED` | Phase 4 | NHS pension error |

Each error includes: `code`, `message`, `cause` (original error), and `context` (employeeId, taxYear, etc.).

---

## Database Dependencies

The payroll engine fetches live data from these tables:

| Table | Used By | Purpose |
|-------|---------|---------|
| `tax_bands` | `tax-bands-utils.ts` | Income tax band rates (cached) |
| `nic_bands` | `ni/database.ts` | NI rates and thresholds |
| `nhs_pension_bands` | `nhs-pension.ts` | NHS pension tier rates |
| `payroll_constants` | Various | Configurable payroll parameters |
| `payroll_results` | Database service | Stored calculation results |

All database queries have **fallback to hardcoded constants** in `tax-constants.ts` if the database is unavailable.

---

## Testing

**Test file:** `src/services/payroll/payrollCalculator.test.ts`

**Test suites:**
- `calculateEarnings` — including reimbursements
- `assemblePayrollResult` — result assembly with rounding
- `calculateTaxDeductions` — income tax with error handling
- `calculateNIContributions` — NI with category support
- `calculatePensionDeductions` — standard + NHS pension
- `NI category rates` — all 8 categories
- `NI fallback calculation` — category-specific rates
- `parseTaxCode — K codes`
- `calculateCumulativeTax — K codes`
- `calculateWeek1Month1Tax — K codes`
- `calculateMonthlyPayroll — K code employee`
- `calculateMonthlyPayroll — reimbursements`
- `calculateStudentLoan — corrected behaviour`
- `HMRC worked examples — NI calculation verification`

**Run:** `bun run test` or `bunx vitest run src/services/payroll/payrollCalculator.test.ts`

---

## Key Constants (2025/26)

```
Personal Allowance:        £12,570/year
Basic Rate:                20% (£0 – £37,700)
Higher Rate:               40% (£37,700 – £125,140)
Additional Rate:           45% (above £125,140)

Employee NI Main Rate:     8% (PT to UEL)
Employee NI Higher Rate:   2% (above UEL)
Employer NI Rate:          15% (above ST)
Secondary Threshold:       £5,000/year (£417/month)
```

All values stored in pennies in `tax-constants.ts` for tax bands (thresholds × 100).

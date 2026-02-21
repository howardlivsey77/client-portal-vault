# Database Schema Documentation

> **Last updated:** February 2026
> **Backend:** Supabase (Postgres) via Lovable Cloud

---

## Table Overview

### Core Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User accounts (synced from `auth.users`) | ✅ |
| `companies` | Company/employer entities | ✅ |
| `company_access` | Maps users to companies with roles | ✅ |
| `employees` | Employee records (PII, payroll data) | ✅ |
| `departments` | Company departments | ✅ |
| `cost_centres` | Cost centre assignments | ✅ |

### Payroll Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `payroll_periods` | Payroll run periods (date ranges, employee counts) | ✅ |
| `payroll_employee_details` | Per-employee hours/entries within a period | ✅ |
| `payroll_results` | Calculated payroll results (tax, NI, pensions, net pay) | ✅ |
| `payroll_import_audit` | Audit trail for imported payroll data | ✅ |
| `payroll_constants` | Configurable payroll parameters | ✅ |
| `payroll_ytd_summary` | **View** — YTD aggregation of payroll_results | — |

### Tax & NI Configuration

| Table | Purpose | RLS |
|-------|---------|-----|
| `tax_bands` | Income tax bands (rates + thresholds per tax year) | ✅ |
| `nic_bands` | National Insurance bands (rates + thresholds per tax year) | ✅ |
| `nhs_pension_bands` | NHS Pension contribution tiers per tax year | ✅ |

### Employee Data

| Table | Purpose | RLS |
|-------|---------|-----|
| `employee_sickness_records` | Sickness absence records | ✅ |
| `employee_sickness_entitlement_usage` | Sickness entitlement tracking | ✅ |
| `employee_sickness_historical_balances` | Opening balances for sickness | ✅ |
| `employee_name_aliases` | Alias names for import matching | ✅ |
| `work_patterns` | Weekly work schedule per employee | ✅ |
| `timesheet_entries` | Daily timesheet records | ✅ |
| `sickness_schemes` | Sickness pay scheme definitions | ✅ |

### HMRC

| Table | Purpose | RLS |
|-------|---------|-----|
| `hmrc_submissions` | FPS/EPS submission tracking | ✅ |

### Auth & Invitations

| Table | Purpose | RLS |
|-------|---------|-----|
| `auth_codes` | 2FA verification codes | ✅ |
| `invitations` | User invitations (invite codes) | ✅ |
| `invitation_metadata` | Extended invitation tracking | ✅ |
| `invitation_resend_log` | Audit of resent invitations | ✅ |

### Documents

| Table | Purpose | RLS |
|-------|---------|-----|
| `documents` | Uploaded files (metadata) | ✅ |
| `document_folders` | Folder hierarchy for documents | ✅ |

### Compliance & Audit

| Table | Purpose | RLS |
|-------|---------|-----|
| `admin_audit_log` | Admin status changes | ✅ |
| `data_access_audit_log` | Sensitive data access tracking | ✅ |
| `sickness_audit_log` | Sickness record discrepancy audit | ✅ |
| `data_retention_policies` | GDPR retention rules | ✅ |
| `data_retention_jobs` | Scheduled retention job tracking | ✅ |
| `data_export_requests` | DSAR (Subject Access Request) tracking | ✅ |
| `erasure_requests` | Right to erasure requests | ✅ |
| `legal_holds` | Legal hold overrides for retention | ✅ |

### Other

| Table | Purpose | RLS |
|-------|---------|-----|
| `tasks` | Internal task management | ✅ |
| `teamnet_rate_configs` | Conditional rate configurations | ✅ |

---

## Key Relationships

```
profiles (1) ←→ (N) company_access (N) ←→ (1) companies
                                                  │
                              ┌────────────────────┤
                              ▼                    ▼
                         employees            departments
                              │                cost_centres
                              │
              ┌───────────────┼───────────────────┐
              ▼               ▼                   ▼
      payroll_results    sickness_records    work_patterns
                         timesheet_entries
```

### Foreign Key Summary

- `company_access.user_id` → `profiles.id`
- `company_access.company_id` → `companies.id`
- `employees.company_id` → `companies.id`
- `departments.company_id` → `companies.id`
- `payroll_results.employee_id` → `employees.id`
- `payroll_results.company_id` → `companies.id`
- `payroll_periods.company_id` → `companies.id`
- `employee_sickness_records.employee_id` → `employees.id`
- `work_patterns.employee_id` → `employees.id`
- `timesheet_entries.employee_id` → `employees.id`
- `documents.company_id` → `companies.id`
- `documents.folder_id` → `document_folders.id`

---

## Key Table Details

### `employees`

The central employee record. Contains both safe (name, department) and sensitive (NI number, salary, tax code) fields.

**Key fields:**
- `payroll_id` — Company-assigned payroll reference
- `tax_code` — HMRC tax code (e.g. "1257L")
- `nic_code` — NI category letter (A/B/C/M/H/Z/J/V)
- `student_loan_plan` — 1, 2, 4, or null (PGL handled separately)
- `monthly_salary` — Contractual monthly pay
- `hourly_rate`, `rate_2`, `rate_3`, `rate_4` — Multiple pay rates
- `nhs_pension_member` — Boolean
- `nhs_pension_tier`, `nhs_pension_employee_rate` — NHS pension details
- `previous_year_pensionable_pay` — For NHS pension tier determination
- `week_one_month_one` — W1/M1 emergency tax flag
- `status` — "active" / "leaver"
- `work_pattern` — Working days pattern

**Sensitive data access:** Protected by `get_employee_safe_data()` and `get_employee_sensitive_data()` database functions.

### `payroll_results`

Stores calculated payroll for each employee per period.

**Key fields:**
- `payroll_period` — Period identifier
- `tax_period`, `tax_year` — HMRC tax period
- `gross_pay_this_period`, `taxable_pay_this_period`
- `income_tax_this_period`, `income_tax_ytd`
- `nic_employee_this_period`, `nic_employer_this_period`
- `student_loan_this_period`
- `employee_pension_this_period`, `employer_pension_this_period`
- `nhs_pension_employee_this_period`, `nhs_pension_employer_this_period`
- `net_pay_this_period`
- `nic_letter` — NI category used
- NI earnings bands: `earnings_at_lel`, `earnings_lel_to_pt`, `earnings_pt_to_uel`, `earnings_above_uel`, `earnings_above_st`
- `free_pay_this_period` — Tax-free pay allowance
- All fields have `_ytd` variants for year-to-date accumulation

### `payroll_ytd_summary` (View)

Aggregates `payroll_results` by employee and tax year for YTD totals.

### `company_access`

Maps users to companies with roles:
- `role`: `'admin'`, `'payroll'`, `'bureau'`, `'user'`

---

## Database Functions

| Function | Purpose |
|----------|---------|
| `accept_invitation` | Process invitation acceptance |
| `create_invitation` | Create new invitation with code |
| `delete_invitation` | Remove invitation |
| `calculate_working_days` | Count working days between dates |
| `create_employee_with_system_user` | Create employee bypassing RLS |
| `get_employee_safe_data` | Return non-sensitive employee fields |
| `get_employee_sensitive_data` | Return sensitive fields (audit logged) |
| `get_current_user_admin_status` | Check if current user is admin |
| `get_current_user_email` | Get authenticated user's email |
| `promote_admin_user` / `demote_admin_user` | Admin status management |

---

## Notes

- All timestamps use `TIMESTAMP WITH TIME ZONE`
- UUIDs are used for all primary keys (`gen_random_uuid()`)
- RLS is enabled on all user-facing tables
- Monetary values in `payroll_results` are stored as `number` (Postgres `numeric`)
- Tax band thresholds in `tax_constants.ts` are stored in **pennies** (× 100)

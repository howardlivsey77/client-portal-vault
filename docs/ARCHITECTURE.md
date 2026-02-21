# Architecture Overview

> **Last updated:** February 2026

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State / Data | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |
| Backend | Supabase (Lovable Cloud) — Postgres, Auth, Storage, Edge Functions |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Excel | SheetJS (xlsx) |
| Search | Fuse.js (client-side fuzzy search) |

---

## Project Structure

```
src/
├── assets/              # Static images and media
├── components/          # UI components organised by domain
│   ├── admin/           # Admin panel (user management, audit logs)
│   ├── auth/            # Login, signup, 2FA, password reset
│   ├── companies/       # Company setup and settings
│   ├── compliance/      # GDPR compliance, data retention, erasure
│   ├── dashboard/       # Main dashboard widgets and charts
│   ├── employees/       # Employee list, detail views, HMRC info
│   ├── invites/         # Invitation management
│   ├── layout/          # App shell, sidebar, topbar
│   ├── notifications/   # Notification bell and panel
│   ├── payroll/         # Payroll calculator, payslips, batch processing
│   ├── profile/         # User profile settings
│   ├── reports/         # Hours/rates reports, sickness reports
│   └── ui/              # shadcn/ui primitives (Button, Dialog, etc.)
├── hooks/               # React hooks organised by domain
│   ├── auth/            # Auth initialisation
│   ├── common/          # Toast, mobile detection, drag/drop
│   ├── dashboard/       # Dashboard data hooks
│   ├── employees/       # Employee CRUD, sickness, timesheets
│   ├── reports/         # Report data hooks
│   └── users/           # User profiles, team members, invites
├── integrations/
│   └── supabase/        # Auto-generated Supabase client and types
├── lib/                 # Shared utilities (formatters, cn, etc.)
├── pages/               # Route-level page components
├── providers/           # React context providers (Auth, Company, Theme)
├── services/            # Business logic layer
│   ├── common/          # Shared service utilities
│   ├── compliance/      # Audit logging, GDPR (export, retention, erasure)
│   ├── documents/       # Document/folder management
│   ├── employees/       # Employee data operations
│   ├── payroll/         # ⭐ Payroll engine (see PAYROLL_ENGINE.md)
│   └── users/           # Profile and company access services
└── types/               # Shared TypeScript types
```

---

## Key Architectural Patterns

### 1. Domain-Driven Organisation

Code is grouped by business domain (employees, payroll, compliance) rather than technical role (models, controllers, views). Each domain has its own components, hooks, and services.

### 2. Service Layer

Business logic lives in `src/services/`, not in components or hooks. Hooks call services; components call hooks. This keeps components thin and logic testable.

```
Component → Hook → Service → Supabase
```

### 3. Barrel Exports

Each domain uses `index.ts` barrel files for clean imports:
```ts
import { calculateMonthlyPayroll } from '@/services/payroll';
import { useEmployees } from '@/hooks';
```
See `src/IMPORT_CONVENTIONS.md` for detailed rules.

### 4. Provider Pattern

Three context providers wrap the app:
- **AuthProvider** — Supabase auth state, `isAdmin` flag, session management
- **CompanyProvider** — Current company context, company-level roles
- **ThemeProvider** — Dark/light mode via `next-themes`

### 5. Permissions

Centralised in `usePermissions()` hook, which combines:
- System-wide admin status (`profiles.is_admin`)
- Company-level role (`company_access.role`)

Produces capability flags: `canEditEmployee`, `canManagePayroll`, `canEditHmrc`, etc.

---

## Feature Map

### Core Features

| Feature | Pages | Key Components |
|---------|-------|----------------|
| **Authentication** | `/auth`, `/create-password`, `/setup-2fa` | Email/password auth, 2FA with QR codes |
| **Dashboard** | `/` (Index) | Payroll summary, HMRC dashboard, employee stats |
| **Employee Management** | `/employees`, `/employee/:id`, `/employee/new` | Full CRUD, department/cost centre assignment |
| **Payroll Calculator** | `/payroll` | Monthly payroll calculation with HMRC compliance |
| **Reports** | `/reports` | Hours/rates report, sickness report |
| **Company Setup** | Via dashboard | Company details, PAYE ref, payroll start period |
| **User Management** | `/invite-management` | Team invitations, role assignment |
| **Profile** | `/profile` | User settings, 2FA management |
| **Notifications** | `/notifications` | In-app notification system |
| **Compliance** | `/security` | GDPR tools, data export, retention, erasure |
| **Timesheets** | `/timesheet-settings` | Work patterns, timesheet entries |
| **Sickness** | `/sickness-import`, employee detail | Sickness records, scheme management, entitlement tracking |
| **Documents** | Via employee/company | Document upload, folder management |

### Payroll Features (Detail)

| Feature | Description |
|---------|-------------|
| Income Tax | Cumulative and Week1/Month1 (W1/M1) calculation, K codes, Scottish rates |
| National Insurance | 8 NI category letters (A/B/C/M/H/Z/J/V), employer NI at 15% |
| Student Loans | Plans 1, 2, 4 + PGL (Postgraduate), HMRC floor rounding |
| Pensions | Standard percentage + NHS Pension (tiered, from database) |
| Reimbursements | Non-NI-able expenses — included in gross for display, excluded from deductions |
| Batch Processing | Process all employees in a payroll period |
| Payslips | PDF generation with full breakdown |
| HMRC Submissions | FPS/EPS submission tracking |
| YTD Tracking | Year-to-date accumulation via database view |

### Compliance Features

| Feature | Service |
|---------|---------|
| Audit Logging | `auditLoggingService` — tracks data access and admin changes |
| Data Export (DSAR) | `dataExportService` — Subject Access Request handling |
| Data Retention | `dataRetentionService` — configurable retention policies |
| Right to Erasure | `rightToErasureService` — GDPR erasure with legal hold support |

---

## Data Flow

### Payroll Calculation Pipeline

```
PayrollDetails (input)
  │
  ├── Phase 1: calculateEarnings()
  │     → grossPay, niableGrossPay, reimbursements
  │
  ├── Phase 2: calculateTaxDeductions()      ─┐
  ├── Phase 3: calculateNIContributions()      ├── Promise.all (concurrent)
  ├── Phase 4: calculatePensionDeductions()   ─┘
  │
  ├── calculateStudentLoan()
  │
  └── Phase 5: assemblePayrollResult()
        → PayrollResult (all rounding happens here)
```

### Authentication Flow

```
User signs in → AuthProvider catches session
  → ensureCompanyAccess() assigns default company
  → CompanyProvider loads company context
  → usePermissions() resolves capability flags
  → UI renders based on permissions
```

---

## Database

See `DATABASE_SCHEMA.md` for full table documentation.

Key tables: `profiles`, `companies`, `company_access`, `employees`, `payroll_results`, `payroll_periods`.

---

## Testing

- **Framework:** Vitest + @testing-library/react
- **Primary test file:** `src/services/payroll/payrollCalculator.test.ts` (118+ tests)
- **Coverage areas:** All payroll calculation phases, NI categories, student loan plans, K codes, HMRC worked examples
- **Run:** `bun run test` or `bunx vitest run`

---

## Related Documentation

- [PAYROLL_ENGINE.md](./PAYROLL_ENGINE.md) — Deep dive into the HMRC-compliant payroll calculation pipeline
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — All tables, relationships, and RLS policies
- [AUTH_AND_PERMISSIONS.md](./AUTH_AND_PERMISSIONS.md) — Authentication, roles, and permission system
- [WORKING_DAYS_SYSTEM.md](./WORKING_DAYS_SYSTEM.md) — Sickness and working days calculation
- [src/IMPORT_CONVENTIONS.md](../src/IMPORT_CONVENTIONS.md) — Import and barrel file conventions

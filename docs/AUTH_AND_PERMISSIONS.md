# Authentication & Permissions

> **Last updated:** February 2026

---

## Authentication

### Provider

Supabase Auth (email/password). Managed via `AuthProvider` (`src/providers/AuthProvider.tsx`).

### Auth Flow

```
1. User signs in → Supabase auth session created
2. AuthProvider detects session via onAuthStateChange
3. Profile loaded from `profiles` table
4. ensureCompanyAccess() assigns default company if needed
5. CompanyProvider loads company context + role
6. App renders with permissions resolved
```

### Two-Factor Authentication (2FA)

- Optional per user (`profiles.is_2fa_enabled`)
- QR code setup via `/setup-2fa`
- Verification codes stored in `auth_codes` table
- Codes have expiry time and attempt limits
- IP address and user agent tracked for security

### Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/auth` | `Auth.tsx` | Login / signup |
| `/create-password` | `CreatePassword.tsx` | Initial password creation |
| `/setup-2fa` | `Setup2FA.tsx` | 2FA configuration |
| `/accept-invite` | `AcceptInvite.tsx` | Accept invitation via code |
| `/invite/:token` | `AcceptInviteToken.tsx` | Accept invitation via URL token |

---

## Company Access Model

### Multi-Company Support

Users can belong to multiple companies. The active company is managed by `CompanyProvider`.

```
User (profiles) ──N:M──> Companies
                  via company_access (with role)
```

### Roles

| Role | Scope | Description |
|------|-------|-------------|
| `admin` | Company | Full access to all company features |
| `payroll` | Company | Can manage payroll and sickness |
| `bureau` | Company | External bureau — read access |
| `user` | Company | Basic employee — view own data |

### System Admin

Separate from company roles. Stored in `profiles.is_admin`.

- Can access admin panel
- Promote/demote other admins (with audit trail in `admin_audit_log`)
- System-wide permissions override company roles

### Default Assignment

When a user signs up or first logs in, `ensureCompanyAccess()` in `companyAccessService.ts`:
1. Checks if user has any company access
2. If not, assigns them to the first company with role `'user'`

---

## Permissions System

### `usePermissions()` Hook

Located at `src/hooks/usePermissions.ts`. Single source of truth for all capability checks.

```ts
const {
  isSystemAdmin,        // profiles.is_admin
  currentRole,          // company_access.role
  canViewEmployees,     // admin | payroll | bureau | user
  canEditEmployee,      // admin only
  canEditOwnRecord,     // admin OR own record (contact fields)
  canManageSickness,    // admin | payroll
  canManagePayroll,     // admin | payroll
  canDeleteEmployee,    // admin only
  canInviteUsers,       // admin only
  canEditHmrc,          // admin only
  canEditNhsPension,    // admin only
  canEditWorkPattern,   // admin only
  canEditSalary,        // admin only
} = usePermissions();
```

### Permission Matrix

| Capability | admin | payroll | bureau | user |
|-----------|-------|---------|--------|------|
| View employees | ✅ | ✅ | ✅ | ✅ |
| Edit any employee | ✅ | ❌ | ❌ | ❌ |
| Edit own record | ✅ | Own only | Own only | Own only |
| Manage sickness | ✅ | ✅ | ❌ | ❌ |
| Manage payroll | ✅ | ✅ | ❌ | ❌ |
| Delete employees | ✅ | ❌ | ❌ | ❌ |
| Invite users | ✅ | ❌ | ❌ | ❌ |
| Edit HMRC info | ✅ | ❌ | ❌ | ❌ |
| Edit NHS pension | ✅ | ❌ | ❌ | ❌ |
| Edit work patterns | ✅ | ❌ | ❌ | ❌ |
| Edit salary | ✅ | ❌ | ❌ | ❌ |

### Usage Pattern

```tsx
// In components — use the hook, not prop drilling
const { canEditEmployee, canManagePayroll } = usePermissions();

if (canEditEmployee) {
  // Show edit button
}
```

---

## Invitation System

### Flow

```
Admin creates invitation
  → Row inserted in `invitations` + `invitation_metadata`
  → Invite code or token generated
  → Email sent to invitee

Invitee accepts
  → Validates code/token + expiry
  → Creates/links account
  → company_access row created with specified role
  → invitation_metadata.is_accepted = true
```

### Tables

- `invitations` — Core invitation data (code, email, expiry)
- `invitation_metadata` — Extended tracking (invited_by, role, accepted_at)
- `invitation_resend_log` — Audit trail for resent invitations

### Security

- Invite codes have expiry dates
- Resend attempts are logged with IP and user agent
- Accepted invitations cannot be reused

---

## Audit Trail

### Admin Changes

`admin_audit_log` tracks:
- Who changed admin status (`changed_by`)
- Target user (`target_user_id`)
- Old/new admin status
- Reason, IP address, user agent

### Data Access

`data_access_audit_log` tracks:
- Which table was accessed
- Which record
- Which sensitive fields were viewed
- User identity, IP, user agent

---

## Database-Level Security

### Row Level Security (RLS)

All user-facing tables have RLS enabled. Policies typically follow:
- Users can read data for companies they belong to (via `company_access`)
- Write operations restricted by role
- System admin bypasses some restrictions via database functions

### Sensitive Data Functions

Employee PII is accessed through controlled database functions:
- `get_employee_safe_data(employee_id)` — Returns non-sensitive fields (name, department, email)
- `get_employee_sensitive_data(employee_id)` — Returns sensitive fields (NI number, salary, tax code) — access is audit-logged

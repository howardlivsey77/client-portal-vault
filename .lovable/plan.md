

# Fix: Allow Payroll Role Users to Delete Absence/Sickness Records

## Problem Analysis

The user `techsupport@ingenisoft.co.uk` has a `payroll` role for "High Street Surgery (test)" company. While the database RLS policies correctly allow `payroll` users to manage sickness records (INSERT, UPDATE, DELETE), the UI components only show management buttons (Add, Edit, Delete) when `isAdmin === true`.

The `isAdmin` flag represents **system-wide** administrator privileges, not company-specific roles like `payroll`.

## Root Cause

| Component | Current Logic | Issue |
|-----------|---------------|-------|
| `SicknessRecordsList.tsx` | `{isAdmin && (...buttons...)}` | Only system admins see buttons |
| `SicknessTrackingCard.tsx` | Receives `isAdmin` prop only | No awareness of payroll role |
| `EmployeeDetails.tsx` | Passes only `isAdmin` from auth | Missing company role context |

## Solution

Update the component chain to check for both system admin status **OR** payroll role permissions.

---

### Step 1: Update EmployeeDetails.tsx

Import `useCompany` and pass both `isAdmin` and `currentRole` to child components.

```text
File: src/pages/EmployeeDetails.tsx

Changes:
- Import useCompany from providers
- Get currentRole from useCompany()
- Create a derived permission: canManageSickness = isAdmin || currentRole === 'admin' || currentRole === 'payroll'
- Pass canManageSickness to SicknessTrackingCard
```

---

### Step 2: Update SicknessTrackingCard Interface

Rename or extend the `isAdmin` prop to accept broader permission context.

```text
File: src/components/employees/details/sickness/SicknessTrackingCard.tsx

Changes:
- Update prop interface to use canManageRecords (or accept isAdmin as-is but callers pass combined permission)
- Pass canManageRecords to SicknessRecordsList instead of isAdmin
```

---

### Step 3: Update SicknessRecordsList Logic

The component already uses `isAdmin` to control button visibility. With the updated prop passing the combined permission, the buttons will appear for payroll users.

```text
File: src/components/employees/details/sickness/SicknessRecordsList.tsx

No changes needed if we pass the combined permission as isAdmin prop.
Alternatively, rename prop to canManageRecords for clarity.
```

---

## Implementation Details

### File: src/pages/EmployeeDetails.tsx

```typescript
// Add import
import { useCompany } from "@/providers/CompanyProvider";

// Inside component, add:
const { currentRole } = useCompany();

// Create combined permission
const canManageSickness = isAdmin || currentRole === 'admin' || currentRole === 'payroll';

// Update SicknessTrackingCard props:
<SicknessTrackingCard
  employee={employee}
  sicknessScheme={sicknessScheme}
  isAdmin={canManageSickness}  // Pass combined permission
/>
```

---

## Database Verification

The RLS policies already support this change. Current policies on `employee_sickness_records`:

```sql
-- FOR ALL operations (including DELETE)
USING (
  is_admin(auth.uid()) OR 
  user_has_company_access(auth.uid(), company_id, 'admin'::text) OR
  user_has_company_access(auth.uid(), company_id, 'payroll'::text)
)
```

No database changes required.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/EmployeeDetails.tsx` | Import `useCompany`, compute `canManageSickness`, pass to `SicknessTrackingCard` |

This is a minimal change that aligns the UI permissions with the existing database RLS policies.

---

## Testing Steps

1. Log in as `techsupport@ingenisoft.co.uk` (payroll role user)
2. Navigate to an employee's details page
3. Go to Sickness Tracking section
4. Verify Add, Edit, and Delete buttons are now visible
5. Attempt to delete a sickness record - should succeed without RLS error


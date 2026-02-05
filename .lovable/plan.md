
# Fix RLS Policies for Payroll Role Users

## Problem Summary

The user `techsupport@ingenisoft.co.uk` has a `payroll` role for "High Street Surgery (test)" company, but cannot import extra hours data because the Row Level Security (RLS) policies on two critical tables only allow `admin` users.

## Tables Affected

| Table | Current Policy | Needed Change |
|-------|----------------|---------------|
| `payroll_periods` | Only `admin` can manage | Add `payroll` role |
| `payroll_employee_details` | Only `admin` can manage | Add `payroll` role |

## Solution

Update the RLS policies to include the `payroll` role, consistent with how other payroll-related tables are configured.

### Database Migration

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Company admins can manage payroll periods" ON public.payroll_periods;
DROP POLICY IF EXISTS "Company admins can manage payroll details" ON public.payroll_employee_details;

-- Create updated policy for payroll_periods
CREATE POLICY "Company admins and payroll can manage payroll periods"
ON public.payroll_periods
FOR ALL
TO authenticated
USING (
  user_has_company_access(auth.uid(), company_id, 'admin'::text) OR
  user_has_company_access(auth.uid(), company_id, 'payroll'::text) OR
  is_admin(auth.uid())
)
WITH CHECK (
  user_has_company_access(auth.uid(), company_id, 'admin'::text) OR
  user_has_company_access(auth.uid(), company_id, 'payroll'::text) OR
  is_admin(auth.uid())
);

-- Create updated policy for payroll_employee_details
CREATE POLICY "Company admins and payroll can manage payroll details"
ON public.payroll_employee_details
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.payroll_periods pp
    WHERE pp.id = payroll_employee_details.payroll_period_id
    AND (
      user_has_company_access(auth.uid(), pp.company_id, 'admin'::text) OR
      user_has_company_access(auth.uid(), pp.company_id, 'payroll'::text)
    )
  )
  OR is_admin(auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.payroll_periods pp
    WHERE pp.id = payroll_employee_details.payroll_period_id
    AND (
      user_has_company_access(auth.uid(), pp.company_id, 'admin'::text) OR
      user_has_company_access(auth.uid(), pp.company_id, 'payroll'::text)
    )
  )
  OR is_admin(auth.uid())
);
```

## Why This Works

- The `payroll` role is already trusted for managing sickness records and entitlements
- The `payroll_import_audit` table already uses `user_has_payroll_access()` which allows `payroll` role
- This change makes the payroll tables consistent with the rest of the system

## Technical Details

The current policies check for:
```sql
user_has_company_access(auth.uid(), company_id, 'admin'::text)
```

This function only returns `true` if the user's role **exactly matches** `'admin'`. The `payroll` role is not included.

By adding:
```sql
user_has_company_access(auth.uid(), company_id, 'payroll'::text)
```

Users with the `payroll` role will also be granted access.

## Impact

- **Sickness Import**: Should already work (policies already include `payroll` role)
- **Extra Hours Import**: Will work after this fix
- **No breaking changes**: Existing admin users retain full access

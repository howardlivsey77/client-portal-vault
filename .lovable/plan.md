
# Refactoring Analysis Report

## 1. Inconsistent Permission Model (High Priority)

The codebase has a fragmented approach to role-based permissions:

- **`isAdmin`** from `AuthProvider` means system-wide admin only
- **`currentRole`** from `CompanyProvider` reflects company-level role (admin, payroll, user, bureau)
- **`canEdit`** is computed ad-hoc in `EmployeeDetails.tsx`
- **`canManageSickness`** was just added as a one-off fix

Currently, each page independently computes permissions like:
```text
const canManageSickness = isAdmin || currentRole === 'admin' || currentRole === 'payroll';
```

This pattern will need repeating for every feature, leading to scattered permission logic.

**Recommendation**: Create a centralised `usePermissions()` hook that exposes clear capabilities:

| Permission | Roles Allowed |
|------------|---------------|
| `canViewEmployees` | admin, payroll, user |
| `canEditEmployee` | admin |
| `canEditOwnRecord` | self |
| `canManageSickness` | admin, payroll |
| `canManagePayroll` | admin, payroll |
| `canDeleteEmployee` | admin |
| `canInviteUsers` | admin |

This single hook would replace all the scattered `isAdmin` prop-drilling and ad-hoc role checks.

---

## 2. Prop Drilling of `isAdmin` (High Priority)

The `isAdmin` prop is passed through many layers of components -- at least 17 component files in the employee details section alone. Many of these could use the `useAuth()` or `useCompany()` hooks directly instead of receiving the prop.

**Affected components include**:
- PersonalInfoCard, ContactInfoCard, SalaryInfoCard
- HmrcInfoCard, NhsPensionInfoCard, WorkPatternCard
- SicknessTrackingCard, SicknessRecordsList
- EmployeeHeader, EmploymentStatusCard
- EmployeeTable, EmployeePortalStatus
- EmployeeFormContainer, EmployeeActions

**Recommendation**: Components that need permission context should use the proposed `usePermissions()` hook directly, eliminating the need to pass `isAdmin`, `canEdit`, and `canManage*` props through 3-4 levels.

---

## 3. Direct Supabase Calls in Page Components (Medium Priority)

`EmployeeDetails.tsx` contains an inline `useEffect` that directly queries Supabase to fetch the sickness scheme (lines 50-80). This breaks the established pattern where data fetching lives in hooks (`useEmployeeDetails`, `useSicknessData`) or service files (`src/services/`).

**Recommendation**: Move the sickness scheme fetching into either:
- The existing `useEmployeeDetails` hook, or
- A new `useSicknessScheme(schemeId)` hook in `src/hooks/employees/`

---

## 4. Use of `confirm()` / `window.confirm()` (Medium Priority)

Native browser `confirm()` dialogs are used in at least 8 places across the codebase for destructive actions (delete employee, delete sickness record, delete department, clear mappings, etc.). These:
- Cannot be styled or branded
- Break the application's visual consistency
- Have no loading state
- Cannot be customised with additional context

**Recommendation**: Replace all `confirm()` calls with the existing `AlertDialog` component from Radix UI (already installed). This would provide a consistent, branded confirmation experience.

---

## 5. CompanyProvider Fallback Complexity (Medium Priority)

`CompanyProvider.tsx` contains deeply nested try/catch blocks with multiple fallback strategies for fetching companies (lines 46-186). There are three levels of retry logic with hardcoded delays (`setTimeout` with 100ms, 500ms). This makes the code difficult to maintain and debug.

**Recommendation**: Simplify to a single fetch strategy with a generic retry utility, or use TanStack Query (already installed) for company data fetching, which provides built-in retry, caching, and error handling.

---

## 6. Duplicate Delete Logic (Low Priority)

Employee deletion is implemented in two separate places:
- `useEmployeeDetails.ts` (line 62) -- used on the details page
- `useEmployees.tsx` -- used on the employee list page

Both contain the same `confirm()` call, permission check, and toast notifications.

**Recommendation**: Extract a shared `deleteEmployee` service function and confirmation flow.

---

## 7. Missing Type Safety on `eligibilityRules` (Low Priority)

In `EmployeeDetails.tsx`, the `SicknessScheme` interface uses `any` for `eligibilityRules` (line 25). This loses the benefit of TypeScript's type checking for a data structure that likely has a known shape.

**Recommendation**: Define a proper `EligibilityRules` type based on the actual data structure stored in the database.

---

## Suggested Priority Order

| Priority | Item | Effort |
|----------|------|--------|
| 1 | Create `usePermissions()` hook | Medium |
| 2 | Replace `isAdmin` prop drilling with hook usage | Medium |
| 3 | Move sickness scheme fetch to a hook | Small |
| 4 | Replace `confirm()` with AlertDialog | Medium |
| 5 | Simplify CompanyProvider fallbacks | Medium |
| 6 | Consolidate duplicate delete logic | Small |
| 7 | Type the eligibility rules properly | Small |

Items 1 and 2 should be done together as they directly relate. Item 3 is a quick win. Items 4-7 can be tackled independently over time.

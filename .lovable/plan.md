

# Split General Settings into Independent Editable Sections

## Overview
Break the single-form General Settings page into three independent cards, each with its own Edit/Save functionality. Address fields will be merged into the Contact Information section.

## Layout (3 Cards)

1. **Company Information** -- Company Name, Trading As, Logo Upload, Payroll Migration Settings
2. **Contact Information** -- Address (Lines 1-4, Post Code), Contact Name, Email, Phone
3. **HMRC Information** -- PAYE Reference, Accounts Office Number, Gateway User ID, Gateway Password

Each card will have an "Edit" button that toggles fields from read-only to editable, and a "Save" / "Cancel" button pair when editing.

## Technical Changes

### 1. Create `src/features/company-settings/components/EditableSettingsCard.tsx`
A reusable wrapper component that manages edit/save state for a section:
- Props: `title`, `description`, `children` (render prop with `isEditing`), `onSave`, `isSaving`
- Displays an "Edit" button in the card header; when clicked, shows form fields as editable with "Save" and "Cancel" buttons
- Wraps content in a Card with CardHeader/CardContent

### 2. Rewrite `src/features/company-settings/tabs/GeneralSettingsTab.tsx`
- Remove the single wrapping Form/Card
- Render three `EditableSettingsCard` instances, each with its own `useForm` + submit handler
- **Card 1 (Company Information)**: `CompanyInfoSection`, `LogoUploadSection`, `PayrollSettingsSection`
- **Card 2 (Contact Information)**: `AddressSection` + `ContactInfoSection` combined
- **Card 3 (HMRC Information)**: `HmrcInfoSection`

### 3. Split `useCompanyForm.ts` into section-specific hooks
Create three focused hooks (or one parameterized hook) that each handle loading and saving only their subset of fields:
- `useCompanyInfoForm` -- name, tradingAs, logoUrl, payrollStartYear, payrollStartPeriod
- `useContactInfoForm` -- addressLine1-4, postCode, contactName, contactEmail, contactPhone
- `useHmrcInfoForm` -- payeRef, accountsOfficeNumber, hmrcGatewayUserId, hmrcGatewayPassword

Each hook follows the same pattern as the current `useCompanyForm`: loads from `currentCompany`, saves via `supabase.from("companies").update(...)`.

### 4. Update section components
- `ContactInfoSection` -- add the address fields (currently in `AddressSection`) into this component, or render both `AddressSection` and `ContactInfoSection` together within the Contact card
- All section components gain a `disabled` prop so fields can be read-only when not editing

### 5. Clean up
- `AddressSection` can be kept as a sub-component rendered inside the Contact card, or merged into `ContactInfoSection`
- Remove the old single `useCompanyForm` hook once all three new hooks are in place

## Files Changed
| File | Action |
|------|--------|
| `src/features/company-settings/components/EditableSettingsCard.tsx` | Create |
| `src/features/company-settings/hooks/useCompanyInfoForm.ts` | Create |
| `src/features/company-settings/hooks/useContactInfoForm.ts` | Create |
| `src/features/company-settings/hooks/useHmrcInfoForm.ts` | Create |
| `src/features/company-settings/tabs/GeneralSettingsTab.tsx` | Rewrite |
| `src/features/company-settings/components/AddressSection.tsx` | Add `disabled` prop |
| `src/features/company-settings/components/ContactInfoSection.tsx` | Add `disabled` prop |
| `src/features/company-settings/components/CompanyInfoSection.tsx` | Add `disabled` prop |
| `src/features/company-settings/components/HmrcInfoSection.tsx` | Add `disabled` prop |
| `src/features/company-settings/components/PayrollSettingsSection.tsx` | Add `disabled` prop |
| `src/features/company-settings/hooks/useCompanyForm.ts` | Remove (replaced by 3 hooks) |


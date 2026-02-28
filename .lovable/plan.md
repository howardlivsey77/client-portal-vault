

# Use Per-Company HMRC Credentials for FPS Generation

## Problem
The FPS edge function currently reads gateway credentials (`HMRC_GATEWAY_USER_ID`, `HMRC_GATEWAY_PASSWORD`) from environment variables, which means all companies share the same credentials. It also falls back to env vars for tax office number, reference, and accounts office number. Since each company has its own HMRC credentials stored in the `companies` table, the function should use those directly.

## Changes

### 1. Update `supabase/functions/generate-fps/index.ts`
- Expand the `select` query on line 77 to also fetch `hmrc_gateway_user_id` and `hmrc_gateway_password` from the company record
- Pass all five company-specific values to `loadEmployerConfig`
- Add a validation check: if any of the required HMRC fields are missing from the company record (tax_office_number, tax_office_reference, accounts_office_number, hmrc_gateway_user_id, hmrc_gateway_password), return a clear 400 error telling the user to complete their Company Settings

### 2. Update `supabase/functions/generate-fps/config.ts`
- Change `loadEmployerConfig` to accept all five company-level fields (add `gatewayUserId` and `gatewayPassword` parameters)
- Use the company DB values directly for all five fields instead of falling back to env vars
- Keep env var fallback only for vendor/product-level settings (`vendorId`, `productName`, `productVersion`, `liveMode`) since those are global, not per-company

### 3. Redeploy the edge function
- Deploy the updated `generate-fps` function after the code changes

## Technical Detail

**`config.ts` signature change:**
```typescript
export function loadEmployerConfig(
  companyTaxOfficeNumber: string,
  companyTaxOfficeReference: string,
  companyAccountsOfficeRef: string,
  companyGatewayUserId: string,
  companyGatewayPassword: string,
): EmployerConfig
```

**`index.ts` select change:**
```typescript
.select('tax_office_number, tax_office_reference, accounts_office_number, hmrc_gateway_user_id, hmrc_gateway_password')
```

**Validation in `index.ts`:**
Before calling `loadEmployerConfig`, check that all five fields are present. If not, return a descriptive error like: "Missing HMRC configuration for this company. Please complete Tax Office Number, Employer PAYE Reference, Accounts Office Number, Gateway User ID, and Gateway Password in Company Settings."

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/generate-fps/index.ts` | Edit (fetch gateway creds from DB, add validation) |
| `supabase/functions/generate-fps/config.ts` | Edit (accept gateway creds as params, remove env var fallback for per-company fields) |


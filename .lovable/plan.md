

# FPS XML Generation UI

## Overview
Build a dialog component that lets users generate HMRC FPS XML files by selecting a tax year and tax period, then preview/download the resulting XML. The dialog will be accessible from the HMRC dashboard card.

## Changes

### 1. Add `generate-fps` to `supabase/config.toml`
Add the function entry with `verify_jwt = false` (it handles auth internally).

### 2. Create `src/components/hmrc/GenerateFpsDialog.tsx`
A dialog with:
- **Tax Year** select dropdown (generated from `generateFinancialYears()` helper, same pattern as `HmrcDashboardCard`)
- **Tax Period** select dropdown (1-12, with month labels like "Period 1 (Apr)")
- **Final Submission** checkbox (optional, for year-end)
- **Generate** button that calls `supabase.functions.invoke('generate-fps', { body: { companyId, taxYear, taxPeriod, finalSubmission } })`
- Loading state during generation
- On success: display employee count and generation timestamp, show the XML in a scrollable `<pre>` block, and provide a **Download XML** button that triggers a file download
- On error: display the error message via toast

### 3. Update `src/components/dashboard/HmrcDashboardCard.tsx`
Add a "Generate FPS" button to the card header (next to the year selector) that opens the `GenerateFpsDialog`. Import and render the dialog, passing the currently selected year as a default.

### 4. Create `src/hooks/hmrc/useGenerateFps.ts`
A custom hook encapsulating the edge function call:
- Accepts `{ companyId, taxYear, taxPeriod, finalSubmission }`
- Returns `{ generate, isLoading, result, error }`
- Uses `supabase.functions.invoke('generate-fps', ...)` 
- Handles response parsing and error extraction

## Technical Notes
- The `generate-fps` edge function already validates auth via the `Authorization` header and checks `user_has_payroll_access`, so the frontend just needs to pass the session token (which the Supabase client does automatically).
- The nine HMRC secrets (e.g., `HMRC_GATEWAY_USER_ID`) are **not yet configured** in Supabase. The function will fail at runtime until those are set. This UI will surface that error clearly so you know when to add them.
- The XML download will use a `Blob` + `URL.createObjectURL` pattern for client-side file save.




# Move FPS Generation to Payroll Processing Page

## What's Changing

Add an **HMRC** tab to the Payroll Processing page (alongside Employee Calculator, Batch Processing, and Payslips) containing the FPS generation form inline (not as a dialog). Remove the "FPS" button from the HMRC Dashboard Card since it's moving here.

## Changes

### 1. Create `src/components/hmrc/FpsGenerationPanel.tsx`
Extract the FPS generation form from the dialog into a standalone card/panel component. It will:
- Reuse the same tax year, tax period, final submission inputs and generate/download logic from `GenerateFpsDialog`
- Accept the currently selected `payPeriod` and `financialYear` from the payroll processing page as defaults
- Render inline (no dialog wrapper) inside a Card

### 2. Update `src/pages/PayrollProcessing.tsx`
- Add a fourth tab: `<TabsTrigger value="hmrc">HMRC</TabsTrigger>`
- Add corresponding `<TabsContent value="hmrc">` rendering the new `FpsGenerationPanel`
- Pass the selected financial year and pay period as defaults

### 3. Update `src/components/dashboard/HmrcDashboardCard.tsx`
- Remove the "FPS" button and the `GenerateFpsDialog` import/render from the dashboard card header

### 4. Keep existing files
- `GenerateFpsDialog.tsx` and `useGenerateFps.ts` remain available (the hook is reused by the new panel; the dialog can be kept or removed)


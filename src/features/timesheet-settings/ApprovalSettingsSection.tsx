
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { TimesheetSettingsFormValues } from "./schema";

interface ApprovalSettingsSectionProps {
  form: UseFormReturn<TimesheetSettingsFormValues>;
}

export function ApprovalSettingsSection({ form }: ApprovalSettingsSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="text-lg font-medium">Approval Settings</h3>
      
      <FormField
        control={form.control}
        name="requireManagerApproval"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Require Manager Approval</FormLabel>
              <FormDescription>
                Timesheet entries require manager approval before being finalized.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="allowEmployeeNotes"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Allow Employee Notes</FormLabel>
              <FormDescription>
                Employees can add notes to explain timesheet discrepancies.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}


import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";

interface HmrcInfoSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

export const HmrcInfoSection = ({ control, disabled }: HmrcInfoSectionProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="grid grid-cols-[120px_1fr] gap-3 md:col-span-1">
        <FormField
          control={control}
          name="taxOfficeNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Office No.</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 120" maxLength={3} {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="taxOfficeReference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer PAYE Ref</FormLabel>
              <FormControl>
                <Input placeholder="e.g. BB58856" {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="accountsOfficeNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Accounts Office Number</FormLabel>
            <FormControl>
              <Input placeholder="Enter accounts office number" {...field} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="hmrcGatewayUserId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>HMRC Gateway User ID</FormLabel>
            <FormControl>
              <Input placeholder="Enter HMRC Gateway User ID" {...field} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="hmrcGatewayPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>HMRC Gateway Password</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription className="text-xs text-muted-foreground">
              Leave blank to keep the existing password. Once saved, the password cannot be viewed.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

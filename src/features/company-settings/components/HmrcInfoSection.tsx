
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
      <FormField
        control={control}
        name="payeRef"
        render={({ field }) => (
          <FormItem>
            <FormLabel>PAYE Reference</FormLabel>
            <FormControl>
              <Input placeholder="Enter PAYE reference" {...field} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
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

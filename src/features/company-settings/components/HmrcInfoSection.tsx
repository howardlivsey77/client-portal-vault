
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { CompanyFormValues } from "../types";

interface HmrcInfoSectionProps {
  control: Control<CompanyFormValues>;
}

export const HmrcInfoSection = ({ control }: HmrcInfoSectionProps) => {
  return (
    <>
      <h3 className="text-lg font-medium mb-4">HMRC Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PAYE Ref */}
        <FormField
          control={control}
          name="payeRef"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PAYE Reference</FormLabel>
              <FormControl>
                <Input placeholder="Enter PAYE reference" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Accounts Office Number */}
        <FormField
          control={control}
          name="accountsOfficeNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accounts Office Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter accounts office number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* HMRC Gateway User ID */}
        <FormField
          control={control}
          name="hmrcGatewayUserId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>HMRC Gateway User ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter HMRC Gateway User ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* HMRC Gateway Password */}
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
    </>
  );
};

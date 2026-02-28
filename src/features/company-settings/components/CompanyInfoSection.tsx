
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";

interface CompanyInfoSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

export const CompanyInfoSection = ({ control, disabled }: CompanyInfoSectionProps) => {
  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter company name" {...field} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="tradingAs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trading As (optional)</FormLabel>
            <FormControl>
              <Input placeholder="Enter trading name" {...field} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};


import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { CompanyFormValues } from "../types";

interface CompanyInfoSectionProps {
  control: Control<CompanyFormValues>;
}

export const CompanyInfoSection = ({ control }: CompanyInfoSectionProps) => {
  return (
    <>
      {/* Company Name */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter company name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Trading As */}
      <FormField
        control={control}
        name="tradingAs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trading As (optional)</FormLabel>
            <FormControl>
              <Input placeholder="Enter trading name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

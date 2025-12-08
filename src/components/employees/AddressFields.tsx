
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types";

interface AddressFieldsProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
}

export const AddressFields = ({ form, readOnly }: AddressFieldsProps) => {
  return (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="font-medium">Address Information</h3>
      
      <FormField
        control={form.control}
        name="address1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 1</FormLabel>
            <FormControl>
              <Input 
                placeholder="Street address, P.O. box, company name" 
                {...field} 
                disabled={readOnly}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="address2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 2</FormLabel>
            <FormControl>
              <Input 
                placeholder="Apartment, suite, unit, building, floor, etc." 
                {...field} 
                disabled={readOnly}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="address3"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 3</FormLabel>
              <FormControl>
                <Input 
                  placeholder="City, town, etc." 
                  {...field} 
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address4"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 4</FormLabel>
              <FormControl>
                <Input 
                  placeholder="State, province, region, etc." 
                  {...field} 
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="postcode"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Postcode / ZIP</FormLabel>
            <FormControl>
              <Input 
                placeholder="Postal or ZIP code" 
                {...field} 
                disabled={readOnly}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

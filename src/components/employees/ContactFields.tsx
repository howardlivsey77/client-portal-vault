
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types/employee";

interface ContactFieldsProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
}

export const ContactFields = ({ form, readOnly }: ContactFieldsProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Contact Information</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input 
                  placeholder="employee@example.com" 
                  type="email"
                  {...field}
                  value={field.value || ""}
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Phone number" 
                  {...field} 
                  value={field.value || ""}
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="emergency_contact"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Emergency Contact</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Emergency contact information" 
                  {...field} 
                  value={field.value || ""}
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

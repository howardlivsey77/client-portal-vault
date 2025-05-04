
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types/employee";

interface ContactFieldsProps {
  form: UseFormReturn<EmployeeFormValues>;
  readOnly: boolean;
}

export const ContactFields = ({ form, readOnly }: ContactFieldsProps) => {
  return (
    <>
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
                disabled={readOnly}
              />
            </FormControl>
            <FormDescription>Optional contact information</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="emergency_contact"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Emergency Contact</FormLabel>
            <FormControl>
              <Input 
                placeholder="Emergency contact details" 
                {...field} 
                disabled={readOnly}
              />
            </FormControl>
            <FormDescription>Name and phone number of emergency contact</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};


import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save } from "lucide-react";
import { Employee } from "@/types/employeeDetails";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ContactInfoCardProps {
  employee: Employee;
  formattedAddress: string;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

// Form schema
const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address").nullable().optional(),
  address1: z.string().nullable().optional(),
  address2: z.string().nullable().optional(),
  address3: z.string().nullable().optional(),
  address4: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
});

type ContactInfoFormValues = z.infer<typeof contactInfoSchema>;

export const ContactInfoCard = ({ 
  employee, 
  formattedAddress, 
  isAdmin, 
  updateEmployeeField 
}: ContactInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  // Setup form
  const form = useForm<ContactInfoFormValues>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      email: employee.email || "",
      address1: employee.address1 || "",
      address2: employee.address2 || "",
      address3: employee.address3 || "",
      address4: employee.address4 || "",
      postcode: employee.postcode || "",
    }
  });

  // Handle edit mode toggle
  const toggleEditMode = () => {
    if (isEditing) {
      // Reset form to original values if canceling
      form.reset({
        email: employee.email || "",
        address1: employee.address1 || "",
        address2: employee.address2 || "",
        address3: employee.address3 || "",
        address4: employee.address4 || "",
        postcode: employee.postcode || "",
      });
    }
    setIsEditing(!isEditing);
  };

  // Handle save
  const onSubmit = async (data: ContactInfoFormValues) => {
    const fieldsToUpdate: Record<string, any> = {
      email: data.email,
      address1: data.address1,
      address2: data.address2,
      address3: data.address3,
      address4: data.address4,
      postcode: data.postcode,
    };

    // Update fields one by one
    for (const [field, value] of Object.entries(fieldsToUpdate)) {
      await updateEmployeeField(field, value);
    }

    // Exit edit mode
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contact Information</CardTitle>
        {isAdmin && (
          <div>
            {isEditing ? (
              <Button 
                type="button" 
                onClick={() => form.handleSubmit(onSubmit)()}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={toggleEditMode}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isEditing ? (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
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
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 3</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
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
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              /* Display mode */
              <div className="grid grid-cols-1 gap-2">
                <div className="mt-2">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{employee.email || "Not provided"}</p>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  {formattedAddress ? (
                    <p className="whitespace-pre-line">{formattedAddress}</p>
                  ) : (
                    <p>No address provided</p>
                  )}
                </div>
              </div>
            )}
            {/* Hidden submit button to enable form submission */}
            <button type="submit" className="hidden" />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

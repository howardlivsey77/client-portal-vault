
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
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Email</h3>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Address Line 1</h3>
                  <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Address Line 2</h3>
                  <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Address Line 3</h3>
                  <FormField
                    control={form.control}
                    name="address3"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Address Line 4</h3>
                  <FormField
                    control={form.control}
                    name="address4"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Postcode</h3>
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              /* Display mode with similar layout to the edit mode */
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Email</h3>
                  <p className="p-2 bg-gray-50 rounded border border-gray-100">
                    {employee.email || "Not provided"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Address Line 1</h3>
                  <p className="p-2 bg-gray-50 rounded border border-gray-100">
                    {employee.address1 || "Not provided"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Address Line 2</h3>
                  <p className="p-2 bg-gray-50 rounded border border-gray-100">
                    {employee.address2 || "Not provided"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Address Line 3</h3>
                  <p className="p-2 bg-gray-50 rounded border border-gray-100">
                    {employee.address3 || "Not provided"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Address Line 4</h3>
                  <p className="p-2 bg-gray-50 rounded border border-gray-100">
                    {employee.address4 || "Not provided"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Postcode</h3>
                  <p className="p-2 bg-gray-50 rounded border border-gray-100">
                    {employee.postcode || "Not provided"}
                  </p>
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

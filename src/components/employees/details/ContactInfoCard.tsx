
import { useState } from "react";
import { Employee } from "@/hooks/useEmployeeDetails";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
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
  email: z.string().email("Invalid email address").optional().nullable(),
  address1: z.string().optional().nullable(),
  address2: z.string().optional().nullable(),
  address3: z.string().optional().nullable(),
  address4: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
});

type ContactInfoFormValues = z.infer<typeof contactInfoSchema>;

export const ContactInfoCard = ({ 
  employee, 
  formattedAddress,
  isAdmin,
  updateEmployeeField 
}: ContactInfoCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

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

    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contact Information</CardTitle>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p>{employee.email || "Not provided"}</p>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <div className="space-y-1">
              {employee.address1 && <p>{employee.address1}</p>}
              {employee.address2 && <p>{employee.address2}</p>}
              {employee.address3 && <p>{employee.address3}</p>}
              {employee.address4 && <p>{employee.address4}</p>}
              {employee.postcode && <p>{employee.postcode}</p>}
              {!formattedAddress && <p>Not provided</p>}
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value || ""} />
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
                    <FormLabel>Postcode / ZIP</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

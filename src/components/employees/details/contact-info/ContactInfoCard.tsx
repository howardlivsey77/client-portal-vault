
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { ContactInfoCardProps, ContactInfoFormValues } from "./types";
import { ContactInfoDisplay } from "./ContactInfoDisplay";
import { ContactInfoForm } from "./ContactInfoForm";

export const ContactInfoCard = ({ 
  employee, 
  formattedAddress,
  isAdmin,
  updateEmployeeField 
}: ContactInfoCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form default values
  const defaultValues: ContactInfoFormValues = {
    email: employee.email || "",
    address1: employee.address1 || "",
    address2: employee.address2 || "",
    address3: employee.address3 || "",
    address4: employee.address4 || "",
    postcode: employee.postcode || "",
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
        <ContactInfoDisplay employee={employee} formattedAddress={formattedAddress} />
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Information</DialogTitle>
          </DialogHeader>
          
          <ContactInfoForm 
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};


import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCompany } from "@/providers/CompanyProvider";
import { supabase } from "@/integrations/supabase/client";

interface ContactInfoFormValues {
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  postCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export const useContactInfoForm = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { currentCompany, refreshCompanies } = useCompany();

  const form = useForm<ContactInfoFormValues>({
    defaultValues: {
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      addressLine4: "",
      postCode: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  useEffect(() => {
    if (currentCompany) {
      form.reset({
        addressLine1: currentCompany.address_line1 || "",
        addressLine2: currentCompany.address_line2 || "",
        addressLine3: currentCompany.address_line3 || "",
        addressLine4: currentCompany.address_line4 || "",
        postCode: currentCompany.post_code || "",
        contactName: currentCompany.contact_name || "",
        contactEmail: currentCompany.contact_email || "",
        contactPhone: currentCompany.contact_phone || "",
      });
    }
  }, [currentCompany, form]);

  const onSubmit = async () => {
    if (!currentCompany?.id) {
      toast.error("No company selected");
      return;
    }
    const data = form.getValues();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          address_line1: data.addressLine1 || null,
          address_line2: data.addressLine2 || null,
          address_line3: data.addressLine3 || null,
          address_line4: data.addressLine4 || null,
          post_code: data.postCode || null,
          contact_name: data.contactName || null,
          contact_email: data.contactEmail || null,
          contact_phone: data.contactPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentCompany.id);
      if (error) throw error;
      toast.success("Contact information saved successfully");
      refreshCompanies();
    } catch (error) {
      console.error("Error saving contact info:", error);
      toast.error("Failed to save contact information");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    if (currentCompany) {
      form.reset({
        addressLine1: currentCompany.address_line1 || "",
        addressLine2: currentCompany.address_line2 || "",
        addressLine3: currentCompany.address_line3 || "",
        addressLine4: currentCompany.address_line4 || "",
        postCode: currentCompany.post_code || "",
        contactName: currentCompany.contact_name || "",
        contactEmail: currentCompany.contact_email || "",
        contactPhone: currentCompany.contact_phone || "",
      });
    }
  };

  return { form, isSaving, onSubmit, resetForm };
};

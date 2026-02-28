
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCompany } from "@/providers/CompanyProvider";
import { supabase } from "@/integrations/supabase/client";

interface HmrcInfoFormValues {
  taxOfficeNumber?: string;
  taxOfficeReference?: string;
  accountsOfficeNumber?: string;
  hmrcGatewayUserId?: string;
  hmrcGatewayPassword?: string;
}

export const useHmrcInfoForm = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { currentCompany, refreshCompanies } = useCompany();

  const form = useForm<HmrcInfoFormValues>({
    defaultValues: {
      taxOfficeNumber: "",
      taxOfficeReference: "",
      accountsOfficeNumber: "",
      hmrcGatewayUserId: "",
      hmrcGatewayPassword: "",
    },
  });

  useEffect(() => {
    if (currentCompany) {
      form.reset({
        taxOfficeNumber: currentCompany.tax_office_number || "",
        taxOfficeReference: currentCompany.tax_office_reference || "",
        accountsOfficeNumber: currentCompany.accounts_office_number || "",
        hmrcGatewayUserId: currentCompany.hmrc_gateway_user_id || "",
        hmrcGatewayPassword: "",
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
          tax_office_number: data.taxOfficeNumber || null,
          tax_office_reference: data.taxOfficeReference || null,
          accounts_office_number: data.accountsOfficeNumber || null,
          hmrc_gateway_user_id: data.hmrcGatewayUserId || null,
          ...(data.hmrcGatewayPassword ? { hmrc_gateway_password: data.hmrcGatewayPassword } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentCompany.id);
      if (error) throw error;
      toast.success("HMRC information saved successfully");
      refreshCompanies();
    } catch (error) {
      console.error("Error saving HMRC info:", error);
      toast.error("Failed to save HMRC information");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    if (currentCompany) {
      form.reset({
        taxOfficeNumber: currentCompany.tax_office_number || "",
        taxOfficeReference: currentCompany.tax_office_reference || "",
        accountsOfficeNumber: currentCompany.accounts_office_number || "",
        hmrcGatewayUserId: currentCompany.hmrc_gateway_user_id || "",
        hmrcGatewayPassword: "",
      });
    }
  };

  return { form, isSaving, onSubmit, resetForm };
};

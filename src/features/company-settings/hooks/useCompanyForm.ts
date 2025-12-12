
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CompanyFormValues } from "../types";
import { toast } from "sonner";
import { useCompany } from "@/providers/CompanyProvider";
import { supabase } from "@/integrations/supabase/client";
import { CURRENT_FINANCIAL_YEAR, CURRENT_PAY_PERIOD } from "@/services/payroll/utils/financial-year-utils";

export const useCompanyForm = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { currentCompany, refreshCompanies } = useCompany();
  
  // Initialize the form with defaults including current financial year/period
  const form = useForm<CompanyFormValues>({
    defaultValues: {
      name: "",
      tradingAs: "",
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      addressLine4: "",
      postCode: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      payeRef: "",
      accountsOfficeNumber: "",
      logoUrl: "",
      payrollStartYear: CURRENT_FINANCIAL_YEAR.year,
      payrollStartPeriod: 1 // Default to Period 1 (April) for new companies
    }
  });

  // Load current company data into form
  useEffect(() => {
    if (currentCompany) {
      form.reset({
        name: currentCompany.name || "",
        tradingAs: currentCompany.trading_as || "",
        addressLine1: currentCompany.address_line1 || "",
        addressLine2: currentCompany.address_line2 || "",
        addressLine3: currentCompany.address_line3 || "",
        addressLine4: currentCompany.address_line4 || "",
        postCode: currentCompany.post_code || "",
        contactName: currentCompany.contact_name || "",
        contactEmail: currentCompany.contact_email || "",
        contactPhone: currentCompany.contact_phone || "",
        payeRef: currentCompany.paye_ref || "",
        accountsOfficeNumber: currentCompany.accounts_office_number || "",
        logoUrl: currentCompany.logo_url || "",
        payrollStartYear: currentCompany.payroll_start_year || CURRENT_FINANCIAL_YEAR.year,
        payrollStartPeriod: currentCompany.payroll_start_period || 1
      });
    }
  }, [currentCompany, form]);

  // Handle form submission
  const onSubmit = async (data: CompanyFormValues) => {
    if (!currentCompany?.id) {
      toast.error("No company selected");
      return;
    }

    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          trading_as: data.tradingAs || null,
          address_line1: data.addressLine1 || null,
          address_line2: data.addressLine2 || null,
          address_line3: data.addressLine3 || null,
          address_line4: data.addressLine4 || null,
          post_code: data.postCode || null,
          contact_name: data.contactName || null,
          contact_email: data.contactEmail || null,
          contact_phone: data.contactPhone || null,
          paye_ref: data.payeRef || null,
          accounts_office_number: data.accountsOfficeNumber || null,
          logo_url: data.logoUrl || null,
          payroll_start_year: data.payrollStartYear || null,
          payroll_start_period: data.payrollStartPeriod || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentCompany.id);

      if (error) throw error;

      toast.success("Company settings saved successfully");
      refreshCompanies();
    } catch (error) {
      console.error("Error saving company settings:", error);
      toast.error("Failed to save company settings");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    isSaving,
    onSubmit
  };
};

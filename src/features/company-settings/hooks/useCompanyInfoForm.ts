
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCompany } from "@/providers/CompanyProvider";
import { supabase } from "@/integrations/supabase/client";
import { CURRENT_FINANCIAL_YEAR } from "@/services/payroll/utils/financial-year-utils";

interface CompanyInfoFormValues {
  name: string;
  tradingAs?: string;
  logoUrl?: string;
  payrollStartYear?: number;
  payrollStartPeriod?: number;
}

export const useCompanyInfoForm = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { currentCompany, refreshCompanies } = useCompany();

  const form = useForm<CompanyInfoFormValues>({
    defaultValues: {
      name: "",
      tradingAs: "",
      logoUrl: "",
      payrollStartYear: CURRENT_FINANCIAL_YEAR.year,
      payrollStartPeriod: 1,
    },
  });

  useEffect(() => {
    if (currentCompany) {
      form.reset({
        name: currentCompany.name || "",
        tradingAs: currentCompany.trading_as || "",
        logoUrl: currentCompany.logo_url || "",
        payrollStartYear: currentCompany.payroll_start_year || CURRENT_FINANCIAL_YEAR.year,
        payrollStartPeriod: currentCompany.payroll_start_period || 1,
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
          name: data.name,
          trading_as: data.tradingAs || null,
          logo_url: data.logoUrl || null,
          payroll_start_year: data.payrollStartYear || null,
          payroll_start_period: data.payrollStartPeriod || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentCompany.id);
      if (error) throw error;
      toast.success("Company information saved successfully");
      refreshCompanies();
    } catch (error) {
      console.error("Error saving company info:", error);
      toast.error("Failed to save company information");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    if (currentCompany) {
      form.reset({
        name: currentCompany.name || "",
        tradingAs: currentCompany.trading_as || "",
        logoUrl: currentCompany.logo_url || "",
        payrollStartYear: currentCompany.payroll_start_year || CURRENT_FINANCIAL_YEAR.year,
        payrollStartPeriod: currentCompany.payroll_start_period || 1,
      });
    }
  };

  return { form, isSaving, onSubmit, resetForm };
};

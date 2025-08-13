
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CompanyFormValues } from "../types";
import { toast } from "sonner";

export const useCompanyForm = () => {
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize the form
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
      logoUrl: ""
    }
  });

  // Handle form submission
  const onSubmit = (data: CompanyFormValues) => {
    setIsSaving(true);
    
    // In a real app, this would save the data to a database
    setTimeout(() => {
      toast.success("Company settings saved successfully");
      setIsSaving(false);
    }, 1000);
    
    console.log("Form submitted:", data);
  };

  return {
    form,
    isSaving,
    onSubmit
  };
};

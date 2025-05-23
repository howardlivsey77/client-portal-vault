
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/providers/CompanyProvider";
import { Company } from "@/types/company";

export const useCompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { refreshCompanies } = useCompany();

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleDeleteCompany = async (companyId: string) => {
    try {
      // First, delete any company_access entries for this company
      const { error: accessError } = await supabase
        .from("company_access")
        .delete()
        .eq("company_id", companyId);
        
      if (accessError) {
        console.error("Error deleting company access:", accessError);
        // Continue anyway to try deleting the company
      }
      
      // Then delete the company
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      
      // Refresh data
      fetchCompanies();
      refreshCompanies();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  return {
    companies,
    loading,
    fetchCompanies,
    handleDeleteCompany
  };
};

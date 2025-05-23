import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { Company, CompanyWithRole } from "@/types/company";
import { useToast } from "@/hooks/use-toast";

interface CompanyContextType {
  currentCompany: Company | null;
  companies: CompanyWithRole[];
  isLoading: boolean;
  switchCompany: (companyId: string) => Promise<void>;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  currentCompany: null,
  companies: [],
  isLoading: true,
  switchCompany: async () => {},
  refreshCompanies: async () => {},
});

export function useCompany() {
  return useContext(CompanyContext);
}

interface CompanyProviderProps {
  children: ReactNode;
}

const CompanyProvider = ({ children }: CompanyProviderProps) => {
  const { user, isAdmin } = useAuth();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<CompanyWithRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Fetch user's accessible companies
  const fetchCompanies = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setCurrentCompany(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the database function to get companies
      const { data, error } = await supabase.rpc('get_user_companies', {
        _user_id: user.id,
      });

      if (error) {
        console.error("Error fetching companies:", error);
        toast({
          title: "Failed to load companies",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Set available companies
      setCompanies(data || []);

      // If there's no current company selected but we have companies
      if ((!currentCompany || !companies.some(c => c.id === currentCompany.id)) && data && data.length > 0) {
        // Try to restore last selected company if it's in the list
        const lastCompanyId = localStorage.getItem('lastSelectedCompany');
        
        if (lastCompanyId && data.some(company => company.id === lastCompanyId)) {
          await fetchCompanyDetails(lastCompanyId);
        } else {
          // Otherwise use the first available company
          await fetchCompanyDetails(data[0].id);
        }
      }

    } catch (error: any) {
      console.error("Exception fetching companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, currentCompany, companies]);

  // Fetch details for a specific company
  const fetchCompanyDetails = async (companyId: string) => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, trading_as, address_line1, address_line2, address_line3, address_line4, post_code, contact_name, contact_email, contact_phone, paye_ref, accounts_office_number, created_at, updated_at, created_by')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error("Error fetching company details:", error);
        return;
      }

      // Cast the data to Company type before setting state
      setCurrentCompany(data as Company);

      // Store the last selected company in localStorage
      localStorage.setItem('lastSelectedCompany', companyId);

    } catch (error) {
      console.error("Exception fetching company details:", error);
    }
  };

  // Switch between companies
  const switchCompany = async (companyId: string) => {
    // Check if this company is in the user's list
    const companyExists = companies.some(company => company.id === companyId);
    
    if (!companyExists) {
      toast({
        title: "Access Denied",
        description: "You don't have access to this company",
        variant: "destructive",
      });
      return;
    }

    await fetchCompanyDetails(companyId);
    
    const companyName = companies.find(c => c.id === companyId)?.name || 'selected company';
    
    toast({
      title: "Company Switched",
      description: `Now viewing ${companyName}`,
    });
  };

  // Refresh the company list
  const refreshCompanies = useCallback(async () => {
    await fetchCompanies();
  }, [fetchCompanies]);

  // Initial load and when user changes
  useEffect(() => {
    fetchCompanies();
  }, [user, fetchCompanies]);

  const value = {
    currentCompany,
    companies,
    isLoading,
    switchCompany,
    refreshCompanies,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};

export default CompanyProvider;


import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { Company, CompanyWithRole } from "@/types/company";
import { toast } from "@/hooks/use-toast";

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

  // Fetch user's accessible companies
  const fetchCompanies = async () => {
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
      if (!currentCompany && data && data.length > 0) {
        await fetchCompanyDetails(data[0].id);
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
  };

  // Fetch details for a specific company
  const fetchCompanyDetails = async (companyId: string) => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error("Error fetching company details:", error);
        return;
      }

      setCurrentCompany(data);

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
    
    toast({
      title: "Company Switched",
      description: `Now viewing ${currentCompany?.name || 'new company'}`,
    });
  };

  // Refresh the company list
  const refreshCompanies = async () => {
    await fetchCompanies();
  };

  // Initial load and when user changes
  useEffect(() => {
    fetchCompanies();
    
    // Try to restore last selected company
    const lastCompanyId = localStorage.getItem('lastSelectedCompany');
    if (lastCompanyId && user) {
      fetchCompanyDetails(lastCompanyId);
    }
  }, [user]);

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

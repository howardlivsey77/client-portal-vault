
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

type Company = {
  id: string;
  name: string;
};

export const useCompanyAccess = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [defaultCompany, setDefaultCompany] = useState<Company | null>(null);
  const { user } = useAuth();

  // Load default company
  useEffect(() => {
    const loadDefaultCompany = async () => {
      try {
        // Get the default company (first one created)
        const { data: company, error } = await supabase
          .from('companies')
          .select('id, name')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
          
        if (error) {
          console.error("Error loading default company:", error);
          return null;
        }
        
        console.log("Default company loaded:", company);
        setDefaultCompany(company);
        return company;
      } catch (error) {
        console.error("Exception loading default company:", error);
        return null;
      }
    };
    
    loadDefaultCompany();
  }, []);

  // Check if user already has company access
  useEffect(() => {
    const checkCompanyAccess = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      
      try {
        console.log("Checking company access for user:", user.id);
        const { data, error } = await supabase
          .from('company_access')
          .select('company_id')
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error checking company access:", error);
        } else {
          const hasCompanyAccess = data && data.length > 0;
          setHasAccess(hasCompanyAccess);
          console.log("User has company access:", hasCompanyAccess, "Records found:", data?.length);
        }
      } catch (error) {
        console.error("Exception checking company access:", error);
      } finally {
        setChecking(false);
      }
    };
    
    checkCompanyAccess();
  }, [user]);
  
  // Load available companies
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .order('name', { ascending: true });
          
        if (error) {
          console.error("Error loading companies:", error);
        } else {
          console.log("Companies loaded:", data?.length);
          setCompanies(data || []);
        }
      } catch (error) {
        console.error("Exception loading companies:", error);
      }
    };
    
    if (!hasAccess) {
      loadCompanies();
    }
  }, [hasAccess]);

  return {
    companies,
    loading,
    checking,
    hasAccess,
    defaultCompany
  };
};

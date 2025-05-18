
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createCompanyAccess } from "@/services/companyAccessService";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2 } from "lucide-react";

export const CompanyAccessSetup = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user already has company access
  useEffect(() => {
    const checkCompanyAccess = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('company_access')
          .select('company_id')
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error checking company access:", error);
        } else {
          setHasAccess(data && data.length > 0);
          console.log("User has company access:", data && data.length > 0);
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
  
  // Setup company access for the current user
  const setupAccess = async (companyId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .rpc('is_admin', { user_id: user.id });
        
      if (adminError) {
        console.error("Error checking admin status:", adminError);
        toast({
          title: "Error",
          description: "Could not check admin status",
          variant: "destructive"
        });
        return;
      }
      
      // Create company access with appropriate role
      const role = adminData ? 'admin' : 'user';
      const success = await createCompanyAccess(user.id, companyId, role);
      
      if (success) {
        toast({
          title: "Success",
          description: "Company access set up successfully",
        });
        setHasAccess(true);
        
        // Reload the page after a short delay to refresh the company context
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: "Failed to set up company access",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (checking) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Checking company access...</span>
      </div>
    );
  }
  
  if (hasAccess) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-green-800">You already have company access. Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <h3 className="font-medium text-yellow-800 mb-2">No Company Access Detected</h3>
      <p className="text-yellow-700 mb-4">You need to be associated with at least one company to use the system.</p>
      
      {companies.length > 0 ? (
        <div>
          <p className="mb-2 text-sm text-yellow-700">Select a company to continue:</p>
          <div className="space-y-2">
            {companies.map(company => (
              <Button
                key={company.id}
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setupAccess(company.id)}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {company.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-yellow-700">No companies available. Please contact an administrator.</p>
      )}
    </div>
  );
};

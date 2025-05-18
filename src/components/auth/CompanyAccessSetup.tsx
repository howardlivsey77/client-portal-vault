
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
  const [manuallyCreatingAccess, setManuallyCreatingAccess] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

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

  // Handle manual company access creation for admins
  const manuallyCreateAccess = async () => {
    if (!user || companies.length === 0) return;
    
    setManuallyCreatingAccess(true);
    try {
      // Get the default company (first one created)
      const defaultCompany = companies[0];
      
      console.log("Manually creating company access for admin user:", user.id, "to company:", defaultCompany.id);
      
      // Create company access with 'admin' role
      const success = await createCompanyAccess(user.id, defaultCompany.id, 'admin');
      
      if (success) {
        toast({
          title: "Access Granted",
          description: `You now have admin access to ${defaultCompany.name}`,
        });
        setHasAccess(true);
        
        // Reload the page after a short delay to refresh the company context
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: "Failed to set up manual company access",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating manual company access:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setManuallyCreatingAccess(false);
    }
  };
  
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
      
      console.log("Admin check result:", adminData);
      
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
      
      {isAdmin && (
        <div className="mb-6">
          <Button
            onClick={manuallyCreateAccess}
            className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
            disabled={manuallyCreatingAccess || companies.length === 0}
          >
            {manuallyCreatingAccess ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Admin Access...
              </>
            ) : (
              'Create Admin Access to Default Company'
            )}
          </Button>
          <p className="text-xs text-yellow-600 italic">
            As an admin user, you can create direct access to the default company.
          </p>
        </div>
      )}
      
      {companies.length > 0 ? (
        <div>
          <p className="mb-2 text-sm text-yellow-700">Or select a company to continue:</p>
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

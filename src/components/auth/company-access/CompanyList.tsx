
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createCompanyAccess } from "@/services";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

type Company = {
  id: string;
  name: string;
};

type CompanyListProps = {
  companies: Company[];
};

export const CompanyList = ({ companies }: CompanyListProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const setupAccess = async (companyId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
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

  if (companies.length === 0) {
    return <p className="text-yellow-700">No companies available. Please contact an administrator.</p>;
  }

  return (
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
  );
};

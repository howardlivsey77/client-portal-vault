
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createCompanyAccess } from "@/services/companyAccessService";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

type AdminAccessOptionProps = {
  defaultCompany: { id: string; name: string } | null;
};

export const AdminAccessOption = ({ defaultCompany }: AdminAccessOptionProps) => {
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const manuallyCreateAccess = async () => {
    if (!user || !defaultCompany) return;
    
    setCreating(true);
    try {
      console.log("Manually creating company access for admin user:", user.id, "to company:", defaultCompany.id);
      
      // Create company access with 'admin' role
      const success = await createCompanyAccess(user.id, defaultCompany.id, 'admin');
      
      if (success) {
        toast({
          title: "Access Granted",
          description: `You now have admin access to ${defaultCompany.name}`,
        });
        
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
      setCreating(false);
    }
  };
  
  if (!defaultCompany) {
    return null;
  }
  
  return (
    <div className="mb-6">
      <Button
        onClick={manuallyCreateAccess}
        className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
        disabled={creating}
      >
        {creating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Admin Access...
          </>
        ) : (
          `Create Admin Access to ${defaultCompany.name}`
        )}
      </Button>
      <p className="text-xs text-yellow-600 italic">
        As an admin user, you can create direct access to the default company.
      </p>
    </div>
  );
};

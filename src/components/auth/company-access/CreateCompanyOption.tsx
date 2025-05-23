
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type CreateCompanyOptionProps = {
  userId?: string;
};

export const CreateCompanyOption = ({ userId }: CreateCompanyOptionProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleCreating = () => {
    setIsCreating(!isCreating);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !companyName.trim()) return;
    
    setLoading(true);
    try {
      // Create the company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{ 
          name: companyName.trim(),
          created_by: userId 
        }])
        .select();
      
      if (companyError) throw companyError;
      
      // Get the created company ID
      if (companyData && companyData.length > 0) {
        const companyId = companyData[0].id;
        
        // Create company access for the user
        const { error: accessError } = await supabase
          .from('company_access')
          .insert([{
            user_id: userId,
            company_id: companyId,
            role: 'admin'  // User who creates a company is automatically an admin
          }]);
        
        if (accessError) throw accessError;
        
        toast({
          title: "Success",
          description: "Company created successfully! You now have admin access.",
        });
        
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
      {!isCreating ? (
        <div>
          <h4 className="font-medium text-yellow-800 mb-2">Create Your Own Company</h4>
          <p className="text-sm text-yellow-700 mb-3">
            You can create a new company and become its administrator.
          </p>
          <Button 
            variant="outline" 
            className="w-full bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            onClick={toggleCreating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Company
          </Button>
        </div>
      ) : (
        <form onSubmit={handleCreateCompany}>
          <h4 className="font-medium text-yellow-800 mb-2">Create New Company</h4>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="companyName" className="text-yellow-800">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="border-yellow-300"
                required
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                type="submit"
                className="bg-teal-500 text-white hover:bg-teal-400 flex-1"
                disabled={loading || !companyName.trim()}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Company
              </Button>
              <Button 
                type="button"
                variant="outline"
                className="border-yellow-300 text-yellow-700"
                onClick={toggleCreating}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

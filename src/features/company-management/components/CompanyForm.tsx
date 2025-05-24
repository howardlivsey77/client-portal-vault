
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/providers/CompanyProvider";
import { Company } from "@/types/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSuccess: () => void;
}

export const CompanyForm = ({
  open,
  onOpenChange,
  company,
  onSuccess
}: CompanyFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    trading_as: "",
    address_line1: "",
    address_line2: "",
    address_line3: "",
    address_line4: "",
    post_code: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    paye_ref: "",
    accounts_office_number: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { refreshCompanies } = useCompany();

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        trading_as: company.trading_as || "",
        address_line1: company.address_line1 || "",
        address_line2: company.address_line2 || "",
        address_line3: company.address_line3 || "",
        address_line4: company.address_line4 || "",
        post_code: company.post_code || "",
        contact_name: company.contact_name || "",
        contact_email: company.contact_email || "",
        contact_phone: company.contact_phone || "",
        paye_ref: company.paye_ref || "",
        accounts_office_number: company.accounts_office_number || "",
      });
    } else {
      setFormData({
        name: "",
        trading_as: "",
        address_line1: "",
        address_line2: "",
        address_line3: "",
        address_line4: "",
        post_code: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        paye_ref: "",
        accounts_office_number: "",
      });
    }
  }, [company, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (company) {
        // Update existing company
        const { error } = await supabase
          .from("companies")
          .update(formData)
          .eq("id", company.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Company updated successfully",
        });
      } else {
        // Create new company - get user ID from auth instead of profiles table
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("You must be logged in to create a company");
        }
        
        // Add the user ID to the company data as the creator
        const companyData = {
          ...formData,
          created_by: user.id
        };
        
        console.log("Creating company with data:", companyData);
        
        // Insert company and return the ID in a single operation
        const { data: newCompany, error: insertError } = await supabase
          .from("companies")
          .insert(companyData)
          .select('id, name')
          .single();

        if (insertError) {
          console.error("Company insert error:", insertError);
          throw insertError;
        }
        
        if (!newCompany) {
          throw new Error("Failed to create company: no company ID returned");
        }
        
        console.log("Company created successfully:", newCompany);
        
        // Create company access for the user with the returned company ID
        const { error: accessError } = await supabase
          .from("company_access")
          .insert({
            user_id: user.id,
            company_id: newCompany.id,
            role: "admin"  // Set the creator as an admin of the company
          });
            
        if (accessError) {
          console.error("Error creating company access:", accessError);
          toast({
            title: "Warning",
            description: "Company created, but there was an issue setting up your access. Please contact support.",
            variant: "destructive",
          });
        } else {
          console.log("Company access created successfully");
          toast({
            title: "Success",
            description: `Company "${newCompany.name}" created successfully`,
          });
        }
      }

      // Refresh data
      onSuccess();
      refreshCompanies();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving company:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save company",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Add New Company"}</DialogTitle>
          <DialogDescription>
            {company 
              ? "Update the company details below." 
              : "Fill in the company details to create a new company."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Official company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trading_as">Trading As</Label>
                <Input
                  id="trading_as"
                  name="trading_as"
                  value={formData.trading_as}
                  onChange={handleInputChange}
                  placeholder="Trading name (if different)"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Address</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                    placeholder="Building, suite, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line3">Address Line 3</Label>
                  <Input
                    id="address_line3"
                    name="address_line3"
                    value={formData.address_line3}
                    onChange={handleInputChange}
                    placeholder="City, town, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line4">Address Line 4</Label>
                  <Input
                    id="address_line4"
                    name="address_line4"
                    value={formData.address_line4}
                    onChange={handleInputChange}
                    placeholder="County, region, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post_code">Post Code</Label>
                  <Input
                    id="post_code"
                    name="post_code"
                    value={formData.post_code}
                    onChange={handleInputChange}
                    placeholder="Post code"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Contact Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    placeholder="Primary contact person"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">HMRC Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paye_ref">PAYE Reference</Label>
                  <Input
                    id="paye_ref"
                    name="paye_ref"
                    value={formData.paye_ref}
                    onChange={handleInputChange}
                    placeholder="PAYE reference"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accounts_office_number">Accounts Office Number</Label>
                  <Input
                    id="accounts_office_number"
                    name="accounts_office_number"
                    value={formData.accounts_office_number}
                    onChange={handleInputChange}
                    placeholder="Accounts office reference"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (company ? "Save Changes" : "Create Company")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

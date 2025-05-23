
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building, Edit, Trash2, Search, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Company } from "@/types/company";
import { useCompany } from "@/providers/CompanyProvider";

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
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
  
  const { toast } = useToast();
  const { refreshCompanies } = useCompany();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
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
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.trading_as?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenForm = (company?: Company) => {
    if (company) {
      setCurrentCompany(company);
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
      setCurrentCompany(null);
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
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentCompany(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentCompany) {
        // Update existing company
        const { error } = await supabase
          .from("companies")
          .update(formData)
          .eq("id", currentCompany.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Company updated successfully",
        });
      } else {
        // Create new company
        const { data: userData } = await supabase.auth.getUser();
        
        // Add the user ID to the company data as the creator
        const companyData = {
          ...formData,
          created_by: userData.user?.id
        };
        
        const { error } = await supabase
          .from("companies")
          .insert([companyData]);

        if (error) throw error;
        
        // After successfully creating a company, automatically create company access for the user
        if (userData.user) {
          const { error: accessError } = await supabase
            .from("company_access")
            .insert([{
              user_id: userData.user.id,
              company_id: (await supabase
                .from("companies")
                .select("id")
                .eq("name", formData.name)
                .limit(1)
                .single()).data?.id,
              role: "admin"  // Set the creator as an admin of the company
            }]);
            
          if (accessError) {
            console.error("Error creating company access:", accessError);
          }
        }
        
        toast({
          title: "Success",
          description: "Company created successfully",
        });
      }

      // Refresh data
      fetchCompanies();
      refreshCompanies();
      handleCloseForm();
    } catch (error: any) {
      console.error("Error saving company:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save company",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async () => {
    if (!currentCompany) return;
    
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", currentCompany.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      
      // Refresh data
      fetchCompanies();
      refreshCompanies();
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (company: Company) => {
    setCurrentCompany(company);
    setIsDeleteDialogOpen(true);
  };

  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Building className="mr-2 h-8 w-8" /> Company Management
          </h1>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" /> Add Company
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Companies</CardTitle>
            <CardDescription>
              Manage all companies in the system. Only administrators can access this page.
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search companies..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Companies</TabsTrigger>
                <TabsTrigger value="recent">Recently Added</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Trading As</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredCompanies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          {searchQuery ? "No matching companies found." : "No companies yet. Add your first company."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCompanies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.trading_as || "-"}</TableCell>
                          <TableCell>
                            {company.contact_name || "-"}
                            {company.contact_email && (
                              <div className="text-xs text-muted-foreground">
                                {company.contact_email}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOpenForm(company)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => confirmDelete(company)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `/settings/companies/users/${company.id}`}
                              >
                                <Users className="h-4 w-4" />
                                <span className="sr-only">Manage Users</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="recent">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Trading As</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...filteredCompanies]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 5)
                        .map((company) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>{company.trading_as || "-"}</TableCell>
                            <TableCell>
                              {new Date(company.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenForm(company)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => confirmDelete(company)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Company Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
            <DialogDescription>
              {currentCompany 
                ? "Update the company details below." 
                : "Fill in the company details to create a new company."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm}>
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
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit">
                {currentCompany ? "Save Changes" : "Create Company"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {currentCompany?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompany}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default CompanyManagement;

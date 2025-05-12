import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from "lucide-react";

// Define the company form type
type CompanyFormValues = {
  companyName: string;
  tradingAs: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  postCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  payeRef: string;
  accountsOfficeNumber: string;
}

const CompanySettings = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isSaving, setIsSaving] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  
  // Load departments from localStorage on component mount
  useEffect(() => {
    const savedDepartments = localStorage.getItem("companyDepartments");
    if (savedDepartments) {
      setDepartments(JSON.parse(savedDepartments));
    }
  }, []);

  // Save departments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("companyDepartments", JSON.stringify(departments));
  }, [departments]);
  
  // Determine which section is active based on the URL
  const getActiveSectionFromPath = () => {
    if (currentPath.includes("/settings/company/holidays")) return "holidays";
    if (currentPath.includes("/settings/company/locations")) return "locations";
    if (currentPath.includes("/settings/company/departments")) return "departments";
    return "general"; // Default tab
  };

  // Initialize the form
  const form = useForm<CompanyFormValues>({
    defaultValues: {
      companyName: "",
      tradingAs: "",
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      addressLine4: "",
      postCode: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      payeRef: "",
      accountsOfficeNumber: ""
    }
  });

  // Handle form submission
  const onSubmit = (data: CompanyFormValues) => {
    setIsSaving(true);
    
    // In a real app, this would save the data to a database
    setTimeout(() => {
      toast.success("Company settings saved successfully");
      setIsSaving(false);
    }, 1000);
    
    console.log("Form submitted:", data);
  };

  // Add new department
  const handleAddDepartment = () => {
    if (newDepartment.trim() === "") return;
    
    if (!departments.includes(newDepartment.trim())) {
      const updatedDepartments = [...departments, newDepartment.trim()];
      // Sort departments alphabetically
      updatedDepartments.sort((a, b) => a.localeCompare(b));
      setDepartments(updatedDepartments);
      setNewDepartment("");
      toast.success("Department added successfully");
    } else {
      toast.error("Department already exists");
    }
  };

  // Remove department
  const handleRemoveDepartment = (departmentToRemove: string) => {
    setDepartments(departments.filter(dept => dept !== departmentToRemove));
    toast.success("Department removed successfully");
  };

  return (
    <PageContainer>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold mb-6">Company Settings</h1>
        
        <Tabs defaultValue={getActiveSectionFromPath()} className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Company Information</CardTitle>
                <CardDescription>
                  Configure your company's basic information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Company Name */}
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Trading As */}
                    <FormField
                      control={form.control}
                      name="tradingAs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trading As (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter trading name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Address Line 1 */}
                      <FormField
                        control={form.control}
                        name="addressLine1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter address line 1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Address Line 2 */}
                      <FormField
                        control={form.control}
                        name="addressLine2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter address line 2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Address Line 3 */}
                      <FormField
                        control={form.control}
                        name="addressLine3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 3</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter address line 3" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Address Line 4 */}
                      <FormField
                        control={form.control}
                        name="addressLine4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 4</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter address line 4" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Post Code */}
                      <FormField
                        control={form.control}
                        name="postCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Post Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter post code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact Name */}
                        <FormField
                          control={form.control}
                          name="contactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter contact name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Contact Email */}
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="Enter contact email" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Contact Phone */}
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter contact phone" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">HMRC Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* PAYE Ref */}
                        <FormField
                          control={form.control}
                          name="payeRef"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PAYE Reference</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter PAYE reference" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Accounts Office Number */}
                        <FormField
                          control={form.control}
                          name="accountsOfficeNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Accounts Office Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter accounts office number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="holidays">
            <Card>
              <CardHeader>
                <CardTitle>Company Holidays</CardTitle>
                <CardDescription>
                  Configure holidays and closures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is where you can manage company-wide holidays and closures.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Company Locations</CardTitle>
                <CardDescription>
                  Manage company office locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configure and manage all your company's office locations.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>
                  Manage company departments and divisions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <FormLabel htmlFor="department-input">Add Department</FormLabel>
                    <Input
                      id="department-input"
                      placeholder="Enter department name"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleAddDepartment}
                    type="button"
                  >
                    Add
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Department List</h3>
                  
                  {departments.length === 0 ? (
                    <p className="text-muted-foreground">No departments added yet. Add your first department above.</p>
                  ) : (
                    <div className="space-y-2">
                      {departments.map((dept, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 bg-muted rounded-md"
                        >
                          <span>{dept}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveDepartment(dept)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default CompanySettings;

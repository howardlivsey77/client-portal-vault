
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CompanyFormValues } from "../types";

const GeneralSettingsTab = () => {
  const [isSaving, setIsSaving] = useState(false);
  
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

  return (
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
  );
};

export default GeneralSettingsTab;

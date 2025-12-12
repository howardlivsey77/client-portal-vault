
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CompanyInfoSection } from "../components/CompanyInfoSection";
import { AddressSection } from "../components/AddressSection";
import { ContactInfoSection } from "../components/ContactInfoSection";
import { HmrcInfoSection } from "../components/HmrcInfoSection";
import { LogoUploadSection } from "../components/LogoUploadSection";
import { PayrollSettingsSection } from "../components/PayrollSettingsSection";
import { useCompanyForm } from "../hooks/useCompanyForm";

const GeneralSettingsTab = () => {
  const { form, isSaving, onSubmit } = useCompanyForm();

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
            <CompanyInfoSection control={form.control} />
            
            <div className="border-t pt-6">
              <LogoUploadSection control={form.control} />
            </div>
            
            <div className="border-t pt-6">
              <AddressSection control={form.control} />
            </div>

            <div className="border-t pt-6">
              <ContactInfoSection control={form.control} />
            </div>

            <div className="border-t pt-6">
              <HmrcInfoSection control={form.control} />
            </div>

            <div className="border-t pt-6">
              <PayrollSettingsSection control={form.control} />
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

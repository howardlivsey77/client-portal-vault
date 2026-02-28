
import { Form } from "@/components/ui/form";
import { CompanyInfoSection } from "../components/CompanyInfoSection";
import { AddressSection } from "../components/AddressSection";
import { ContactInfoSection } from "../components/ContactInfoSection";
import { HmrcInfoSection } from "../components/HmrcInfoSection";
import { LogoUploadSection } from "../components/LogoUploadSection";
import { PayrollSettingsSection } from "../components/PayrollSettingsSection";
import { EditableSettingsCard } from "../components/EditableSettingsCard";
import { useCompanyInfoForm } from "../hooks/useCompanyInfoForm";
import { useContactInfoForm } from "../hooks/useContactInfoForm";
import { useHmrcInfoForm } from "../hooks/useHmrcInfoForm";

const GeneralSettingsTab = () => {
  const companyInfo = useCompanyInfoForm();
  const contactInfo = useContactInfoForm();
  const hmrcInfo = useHmrcInfoForm();

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <EditableSettingsCard
        title="Company Information"
        description="Company name, logo, and payroll migration settings"
        isSaving={companyInfo.isSaving}
        onSave={companyInfo.onSubmit}
        onCancel={companyInfo.resetForm}
      >
        {(isEditing) => (
          <Form {...companyInfo.form}>
            <div className="space-y-6">
              <CompanyInfoSection control={companyInfo.form.control} disabled={!isEditing} />
              <div className="border-t pt-6">
                <LogoUploadSection control={companyInfo.form.control} />
              </div>
              <div className="border-t pt-6">
                <PayrollSettingsSection control={companyInfo.form.control} disabled={!isEditing} />
              </div>
            </div>
          </Form>
        )}
      </EditableSettingsCard>

      {/* Contact Information */}
      <EditableSettingsCard
        title="Contact Information"
        description="Address and contact details"
        isSaving={contactInfo.isSaving}
        onSave={contactInfo.onSubmit}
        onCancel={contactInfo.resetForm}
      >
        {(isEditing) => (
          <Form {...contactInfo.form}>
            <div className="space-y-6">
              <AddressSection control={contactInfo.form.control} disabled={!isEditing} />
              <div className="border-t pt-6">
                <ContactInfoSection control={contactInfo.form.control} disabled={!isEditing} />
              </div>
            </div>
          </Form>
        )}
      </EditableSettingsCard>

      {/* HMRC Information */}
      <EditableSettingsCard
        title="HMRC Information"
        description="PAYE reference, accounts office, and gateway credentials"
        isSaving={hmrcInfo.isSaving}
        onSave={hmrcInfo.onSubmit}
        onCancel={hmrcInfo.resetForm}
      >
        {(isEditing) => (
          <Form {...hmrcInfo.form}>
            <HmrcInfoSection control={hmrcInfo.form.control} disabled={!isEditing} />
          </Form>
        )}
      </EditableSettingsCard>
    </div>
  );
};

export default GeneralSettingsTab;

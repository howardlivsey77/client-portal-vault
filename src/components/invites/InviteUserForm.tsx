import React, { useEffect } from "react";
import { EmailField } from "./EmailField";
import { RoleSelection } from "./RoleSelection";
import { FormSubmitButton } from "./FormSubmitButton";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCompany } from "@/providers/CompanyProvider";

interface InviteUserFormProps {
  email: string;
  setEmail: (email: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
}

export const InviteUserForm = ({
  email,
  setEmail,
  selectedRole,
  setSelectedRole,
  loading,
  onSubmit,
  selectedCompanyId,
  setSelectedCompanyId
}: InviteUserFormProps) => {
  const { companies, currentCompany } = useCompany();

  useEffect(() => {
    if (!selectedCompanyId && currentCompany?.id) {
      setSelectedCompanyId(currentCompany.id);
    }
  }, [currentCompany?.id, selectedCompanyId, setSelectedCompanyId]);

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4 py-4">
        <EmailField email={email} setEmail={setEmail} />

        <div className="space-y-2">
          <Label>Company</Label>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <RoleSelection selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
      </div>
      
      <div className="flex justify-end">
        <FormSubmitButton loading={loading} />
      </div>
    </form>
  );
};

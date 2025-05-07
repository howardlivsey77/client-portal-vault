
import React from "react";
import { EmailField } from "./EmailField";
import { RoleSelection } from "./RoleSelection";
import { FormSubmitButton } from "./FormSubmitButton";

interface InviteUserFormProps {
  email: string;
  setEmail: (email: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const InviteUserForm = ({
  email,
  setEmail,
  selectedRole,
  setSelectedRole,
  loading,
  onSubmit
}: InviteUserFormProps) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4 py-4">
        <EmailField email={email} setEmail={setEmail} />
        <RoleSelection selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
      </div>
      
      <div className="flex justify-end">
        <FormSubmitButton loading={loading} />
      </div>
    </form>
  );
};

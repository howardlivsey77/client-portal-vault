
import { MfaSetupCard } from "./security/MfaSetupCard";
import { PasswordCard } from "./security/PasswordCard";

export const ProfileSecurityTab = () => {
  return (
    <div className="space-y-6">
      <MfaSetupCard />
      <PasswordCard />
    </div>
  );
};

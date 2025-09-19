
import { useAuth } from "@/providers/ClerkAuthProvider";
import { CompanyAccessCard } from "./company-access/CompanyAccessCard";
import { CheckingAccess } from "./company-access/CheckingAccess";
import { HasAccessRedirect } from "./company-access/HasAccessRedirect";
import { AdminAccessOption } from "./company-access/AdminAccessOption";
import { CompanyList } from "./company-access/CompanyList";
import { useCompanyAccess } from "./company-access/useCompanyAccess";
import { CreateCompanyOption } from "./company-access/CreateCompanyOption";

export const CompanyAccessSetup = () => {
  const { isAdmin, user } = useAuth();
  const { companies, checking, hasAccess, defaultCompany } = useCompanyAccess();

  // Show checking state while auth or company access is being determined
  if (checking || !user) {
    return <CheckingAccess />;
  }
  
  if (hasAccess) {
    return (
      <CompanyAccessCard variant="success">
        <HasAccessRedirect />
      </CompanyAccessCard>
    );
  }

  return (
    <CompanyAccessCard variant="warning">
      <h3 className="font-medium text-yellow-800 mb-2">No Company Access Detected</h3>
      <p className="text-yellow-700 mb-4">You need to be associated with at least one company to use the system.</p>
      
      {/* Allow any user to create a company */}
      <CreateCompanyOption userId={user?.id} />
      
      {isAdmin && defaultCompany && (
        <AdminAccessOption defaultCompany={defaultCompany} />
      )}
      
      <CompanyList companies={companies} />
    </CompanyAccessCard>
  );
};

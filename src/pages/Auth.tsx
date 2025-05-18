
import { Loader2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuthInitialization } from "@/hooks/useAuthInitialization";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { ensureCompanyAccess } from "@/services/companyAccessService";
import { CompanyAccessSetup } from "@/components/auth/CompanyAccessSetup";
import { useAuth } from "@/providers/AuthProvider";

const Auth = () => {
  const { authInitialized } = useAuthInitialization();
  const { user } = useAuth();

  // Show loading indicator until we've checked the session
  if (!authInitialized) {
    return <PageContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>;
  }

  return <PageContainer>
    {user ? (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-16">
        <CompanyAccessSetup />
      </div>
    ) : (
      <AuthContainer onSuccess={ensureCompanyAccess} />
    )}
  </PageContainer>;
};

export default Auth;

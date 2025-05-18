
import { Loader2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuthInitialization } from "@/hooks/useAuthInitialization";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { ensureCompanyAccess } from "@/services/companyAccessService";

const Auth = () => {
  const { authInitialized } = useAuthInitialization();

  // Show loading indicator until we've checked the session
  if (!authInitialized) {
    return <PageContainer>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>;
  }

  return <PageContainer>
    <AuthContainer onSuccess={ensureCompanyAccess} />
  </PageContainer>;
};

export default Auth;

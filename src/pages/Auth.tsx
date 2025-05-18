
import { Loader2 } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuthInitialization } from "@/hooks/useAuthInitialization";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { ensureCompanyAccess } from "@/services/companyAccessService";
import { CompanyAccessSetup } from "@/components/auth/CompanyAccessSetup";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const { authInitialized } = useAuthInitialization();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // If user has access, redirect to home
  useEffect(() => {
    if (user) {
      const checkRedirect = async () => {
        try {
          const { data, error } = await supabase
            .from('company_access')
            .select('company_id')
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error checking company access for redirect:", error);
          } else if (data && data.length > 0) {
            console.log("User has company access, redirecting to home");
            navigate("/");
          }
        } catch (error) {
          console.error("Exception checking company access for redirect:", error);
        }
      };
      
      checkRedirect();
    }
  }, [user, navigate]);

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

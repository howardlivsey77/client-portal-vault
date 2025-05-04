
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { useSession } from "@/hooks/use-session";

const Auth = () => {
  const navigate = useNavigate();
  
  const handleSuccessfulLogin = () => {
    navigate("/");
  };
  
  const { session, loading } = useSession(() => {
    navigate("/");
  });

  // If already logged in or still checking session, don't render form
  if (loading || session) {
    return <PageContainer />;
  }

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto mt-16">
        <AuthCard 
          title="Document Vault" 
          description="Access your secure document portal"
        >
          <LoginForm onSuccess={handleSuccessfulLogin} />
        </AuthCard>
      </div>
    </PageContainer>
  );
};

export default Auth;

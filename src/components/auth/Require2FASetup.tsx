import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers";
import { Loader2 } from "lucide-react";

interface Require2FASetupProps {
  children: ReactNode;
}

const Require2FASetup = ({ children }: Require2FASetupProps) => {
  const { user, isLoading, requires2FASetup } = useAuth();
  const location = useLocation();
  
  // Don't block the /setup-2fa page itself
  if (location.pathname === "/setup-2fa") {
    return <>{children}</>;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // If user is not authenticated, this should be handled by ProtectedRoute
  if (!user) {
    return <>{children}</>;
  }
  
  // If user requires 2FA setup, redirect to setup page
  if (requires2FASetup) {
    console.log("User requires 2FA setup, redirecting to /setup-2fa");
    return <Navigate to="/setup-2fa" replace />;
  }
  
  return <>{children}</>;
};

export default Require2FASetup;
